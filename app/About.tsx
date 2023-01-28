interface AboutProps {
  about: string;
}

const About: React.FC<AboutProps> = ({ about }) => (
  <div className="py-8">
    <p>{about}</p>
  </div>
);

export default About;
