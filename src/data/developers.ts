export interface Developer {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  email?: string;
}

export const developers: Developer[] = [
  {
    id: "3",
    name: "Zarar Moaviya",
    role: "Software Developer",
    bio: "Develops scalable modules, optimizes frontend performance, and maintains state management consistency.",
    github: "github.com/wahabejaz",
    linkedin: "linkedin.com/in/zararmoaviya",
    portfolio: "zarar.dev",
    email: "zarar.bscs5022@student.iiu.edu.pk"
  },
  {
    id: "2",
    name: "Wahab Ejaz",
    role: "Software Developer",
    bio: "Builds API services, monitors data flows, and architects future-ready persistence for ISP automation.",
    github: "github.com/wahabejaz",
    linkedin: "https://www.linkedin.com/in/wahab-ejaz-025821283/",
    portfolio: "https://wahabejaz.pythonanywhere.com/",
    email: "wahabejaz.binary@gmail.com"
  },
  {
    id: "4",
    name: "Abuzar Amir",
    role: "Software Developer",
    bio: "Operates deployments, improves observability, and keeps uptime within strict customer SLAs.",
    github: "github.com/abuzaramir",
    linkedin: "https://www.linkedin.com/in/abuzar-amir-a99881349/",
    portfolio: "abuzar.dev",
    email: "abuzar.bscs5028@student.iiu.edu.pk"
  }
];
