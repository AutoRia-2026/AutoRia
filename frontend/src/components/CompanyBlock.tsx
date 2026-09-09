import { teamMembers } from '../constants/cars'

function CompanyBlock() {
  return (
    <section className="company-block">
      <article>
        <h2>About Our Company</h2>
        <p>We connect buyers and sellers through a trusted platform with quality vehicles, transparent listings, and an easy search experience.</p>
      </article>
      {teamMembers.map((member) => (
        <article className="team-card" key={member.name}>
          <img src={member.image} alt={member.name} />
          <div>
            <h3>{member.name}</h3>
            <span>{member.role}</span>
            <p>Responsible for keeping the vehicle experience simple, transparent and useful for every customer.</p>
          </div>
        </article>
      ))}
    </section>
  )
}

export default CompanyBlock
