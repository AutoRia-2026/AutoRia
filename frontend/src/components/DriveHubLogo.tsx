type DriveHubLogoProps = {
  className?: string
  onClick: () => void
}

function DriveHubLogo({ className = 'drive-logo', onClick }: DriveHubLogoProps) {
  return (
    <button className={className} type="button" onClick={onClick}>
      <span>DRIVE HUB</span>
    </button>
  )
}

export default DriveHubLogo
