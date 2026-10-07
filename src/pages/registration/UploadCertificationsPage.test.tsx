import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UploadCertificationsPage } from './UploadCertificationsPage';
import {
  clearStagedCertificates,
  stagedCertificates,
} from '../../features/registration/stagedCertificates';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register/interpreter']}>
      <Routes>
        <Route path="/register/interpreter" element={<UploadCertificationsPage />} />
        <Route path="/register/interpreter/account" element={<p>sign up page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const pdf = () => new File(['x'], 'cert.pdf', { type: 'application/pdf' });

describe('UploadCertificationsPage (V2-003)', () => {
  afterEach(() => clearStagedCertificates());

  it('blocks submission and shows errors when required fields are missing', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Upload your certificate.')).toBeInTheDocument();
    expect(screen.getByText('Select a certificate type.')).toBeInTheDocument();
    expect(screen.getByText('Enter the issuing organisation.')).toBeInTheDocument();
    expect(stagedCertificates()).toHaveLength(0);
  });

  it('rejects files that are not PDF, JPG or PNG', async () => {
    renderPage();
    const bad = new File(['x'], 'cert.txt', { type: 'text/plain' });
    await userEvent.upload(screen.getByLabelText('Certificate file 1'), bad, {
      applyAccept: false,
    });
    expect(screen.getByText('Upload a PDF, JPG or PNG file.')).toBeInTheDocument();
  });

  it('holds a complete certificate in memory and moves on to the sign-up page', async () => {
    renderPage();
    await userEvent.upload(screen.getByLabelText('Certificate file 1'), pdf());
    await userEvent.selectOptions(screen.getByLabelText('Certificate type *'), 'Other');
    await userEvent.type(screen.getByLabelText('Issuing organisation *'), 'UNAD');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(screen.getByText('sign up page')).toBeInTheDocument());
    expect(stagedCertificates()).toHaveLength(1);
  });

  it('lets the user add another certificate', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: '+ Add another certificate' }));
    expect(screen.getAllByText('Browse files')).toHaveLength(2);
  });
});
