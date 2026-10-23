export default function PatientStatusBadge({ status }) {
  switch (status) {
    case 'ACTIVE':
      return <span className="badge badge-active">Active</span>
    case 'INACTIVE':
      return <span className="badge badge-inactive">Inactive</span>
    case 'DECEASED':
      return <span className="badge badge-deceased">Deceased</span>
    default:
      return <span className="badge badge-inactive">{status || 'UNKNOWN'}</span>
  }
}
