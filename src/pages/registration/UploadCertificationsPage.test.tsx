import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../../services/api';
import * as certifications from '../../services/certifications';
import { UploadCertificationsPage } from './UploadCertificationsPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register/interpreter/certifications']}>
      <Routes>
        <Route path="/register/interpreter/certifications" element={<UploadCertificationsPage />} />
        <Route path="/register/pending" element={<p>pending review</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const pdf = (name = 'cert.pdf') => new File(['x'], name, { type: 'application/pdf' });

const fillCertificate = async (index = 1, name = 'cert.pdf') => {
  await userEvent.upload(screen.getByLabelText(`Certificate file ${index}`), pdf(name));
  await userEvent.selectOptions(screen.getAllByLabelText('Certificate type *')[index - 1], 'Other');
  await userEvent.type(screen.getAllByLabelText('Issuing organisation *')[index - 1], 'UNAD');
};

describe('UploadCertificationsPage (V2-003)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('blocks submission and shows errors when required fields are missing', async () => {
    const upload = vi.spyOn(certifications, 'uploadCertificate');
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Upload your certificate.')).toBeInTheDocument();
    expect(screen.getByText('Select a certificate type.')).toBeInTheDocument();
    expect(screen.getByText('Enter the issuing organisation.')).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects files that are not PDF, JPG or PNG', async () => {
    renderPage();
    const bad = new File(['x'], 'cert.txt', { type: 'text/plain' });
    await userEvent.upload(screen.getByLabelText('Certificate file 1'), bad, {
      applyAccept: false,
    });
    expect(screen.getByText('Upload a PDF, JPG or PNG file.')).toBeInTheDocument();
  });

  it('uploads a complete certificate and moves on to the review', async () => {
    const upload = vi
      .spyOn(certifications, 'uploadCertificate')
      .mockResolvedValue({} as certifications.CertificationDocument);
    renderPage();
    await fillCertificate();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(screen.getByText('pending review')).toBeInTheDocument());
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Other', organisation: 'UNAD' }),
    );
  });

  it('keeps the page and retries only what is left when an upload fails', async () => {
    const upload = vi
      .spyOn(certifications, 'uploadCertificate')
      .mockResolvedValueOnce({} as certifications.CertificationDocument)
      .mockRejectedValueOnce(new ApiError(500, 'Server error'))
      .mockResolvedValue({} as certifications.CertificationDocument);
    renderPage();
    await fillCertificate(1, 'a.pdf');
    await userEvent.click(screen.getByRole('button', { name: '+ Add another certificate' }));
    await fillCertificate(2, 'b.pdf');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('did not upload');
    expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('b.pdf')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(screen.getByText('pending review')).toBeInTheDocument());
    // a.pdf once, b.pdf failed then retried: three calls, the first one never repeated.
    expect(upload).toHaveBeenCalledTimes(3);
  });

  it('lets the user add another certificate', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: '+ Add another certificate' }));
    expect(screen.getAllByText('Browse files')).toHaveLength(2);
  });
});
