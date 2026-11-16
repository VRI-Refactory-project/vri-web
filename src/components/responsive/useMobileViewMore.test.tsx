import { fireEvent, render, screen } from '@testing-library/react';
import { useMobileViewMore } from './useMobileViewMore';

function RecordList({ records }: { records: string[] }) {
  const mobileRows = useMobileViewMore(records.length);

  return (
    <>
      <ul>
        {records.map((record, index) => (
          <li key={record} {...mobileRows.itemProps(index)}>
            {record}
          </li>
        ))}
      </ul>
      {mobileRows.button}
    </>
  );
}

describe('useMobileViewMore', () => {
  it('reveals records after the first five and can collapse them again', () => {
    render(<RecordList records={['one', 'two', 'three', 'four', 'five', 'six', 'seven']} />);

    expect(screen.getByText('six').closest('li')).toHaveAttribute(
      'data-mobile-view-hidden',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'View more' }));
    expect(screen.getByText('six').closest('li')).not.toHaveAttribute('data-mobile-view-hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getByText('six').closest('li')).toHaveAttribute(
      'data-mobile-view-hidden',
      'true',
    );
  });

  it('does not render a view-more control for five or fewer records', () => {
    render(<RecordList records={['one', 'two', 'three', 'four', 'five']} />);

    expect(screen.queryByRole('button', { name: 'View more' })).not.toBeInTheDocument();
  });
});
