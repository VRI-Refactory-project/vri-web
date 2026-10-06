import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UploadCertificationsPage } from './UploadCertificationsPage';
import * as certifications from '../../services/certifications';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register/interpreter/certifications']}>
      <Routes>
        <Route path="/register/interpreter/certifications" element={<UploadCertificationsPage />} />
        <Route path="/register/interpreter/pending" element={<p>pending verification</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const pdf = () => new File(['x'], 'cert.pdf', { type: 'application/pdf' });

describe('UploadCertificationsPage (V2-003)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('blocks submission and shows errors when required fields are missing', async () => {
    const upload = vi.spyOn(certifications, 'uploadCertifications');
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

  it('uploads a complete certificate and moves to the pending screen', async () => {
    const upload = vi.spyOn(certifications, 'uploadCertifications').mockResolvedValue();
    renderPage();
    await userEvent.upload(screen.getByLabelText('Certificate file 1'), pdf());
    await userEvent.selectOptions(screen.getByLabelText('Certificate type *'), 'Other');
    await userEvent.type(screen.getByLabelText('Issuing organisation *'), 'UNAD');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(screen.getByText('pending verification')).toBeInTheDocument());
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('lets the user add another certificate', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: '+ Add another certificate' }));
    expect(screen.getAllByText('Browse files')).toHaveLength(2);
  });
});
