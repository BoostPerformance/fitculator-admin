type Project = {
  name: string;
  company: string;
  author: string;
  status: string;
};

export default function LatestProjects() {
  const projects: Project[] = [
    {
      name: 'Project1',
      company: 'Web Design',
      author: 'Macey Metz',
      status: '45%',
    },
    {
      name: 'Project2',
      company: 'Transportation',
      author: 'Green Wiza',
      status: '56%',
    },
    {
      name: 'Project3',
      company: 'UI/UX Design',
      author: 'Sim Renner',
      status: '99%',
    },
  ];

  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h2 className="text-lg font-semibold mb-4 text-black">Latest Projects</h2>
      <ul>
        {projects.map((project, idx) => (
          <li
            key={idx}
            className="flex justify-between py-2 border-b text-black"
          >
            <span>{project.name}</span>
            <span>{project.company}</span>
            <span>{project.author}</span>
            <span>{project.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
