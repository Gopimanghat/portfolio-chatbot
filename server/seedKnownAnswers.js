import pool from "./db.js";
import { getEmbedding } from "./embeddings.js";

const qaPairs = [
    // Education
    {
        question: "What is your educational background?",
        answer:
            "I'm pursuing an MCA specializing in AI & Machine Learning at Amrita Vishwa Vidyapeetham (self-paced online), and completed my BSc in Computer Science from College of Applied Science, Vadakkencherry (University of Calicut), 2022–2025.",
    },
    {
        question: "Where did you study?",
        answer:
            "I'm pursuing an MCA specializing in AI & Machine Learning at Amrita Vishwa Vidyapeetham (self-paced online), and completed my BSc in Computer Science from College of Applied Science, Vadakkencherry (University of Calicut), 2022–2025.",
    },
    {
        question: "What's your degree?",
        answer:
            "I'm pursuing an MCA specializing in AI & Machine Learning at Amrita Vishwa Vidyapeetham (self-paced online), and completed my BSc in Computer Science from College of Applied Science, Vadakkencherry (University of Calicut), 2022–2025.",
    },
    {
        question: "Tell me about your education",
        answer:
            "I'm pursuing an MCA specializing in AI & Machine Learning at Amrita Vishwa Vidyapeetham (self-paced online), and completed my BSc in Computer Science from College of Applied Science, Vadakkencherry (University of Calicut), 2022–2025.",
    },

    // Skills
    {
        question: "What are your skills?",
        answer:
            "I work with Python, JavaScript, and SQL. Frontend: React, HTML, CSS, TailwindCSS. Backend: Node.js, FastAPI. Databases: PostgreSQL, MongoDB, Supabase. I also integrate LLM APIs like Claude and OpenAI.",
    },
    {
        question: "What technologies do you know?",
        answer:
            "I work with Python, JavaScript, and SQL. Frontend: React, HTML, CSS, TailwindCSS. Backend: Node.js, FastAPI. Databases: PostgreSQL, MongoDB, Supabase. I also integrate LLM APIs like Claude and OpenAI.",
    },
    {
        question: "What's your tech stack?",
        answer:
            "I work with Python, JavaScript, and SQL. Frontend: React, HTML, CSS, TailwindCSS. Backend: Node.js, FastAPI. Databases: PostgreSQL, MongoDB, Supabase. I also integrate LLM APIs like Claude and OpenAI.",
    },
    {
        question: "What languages do you code in?",
        answer:
            "I work with Python, JavaScript, and SQL. Frontend: React, HTML, CSS, TailwindCSS. Backend: Node.js, FastAPI. Databases: PostgreSQL, MongoDB, Supabase. I also integrate LLM APIs like Claude and OpenAI.",
    },

    // Current role/experience
    {
        question: "What do you do currently?",
        answer:
            "I'm a Full Stack Developer on QuickRekruit, an EU startup project, since Jan 2026 — building REST APIs with Node/Express/PostgreSQL, React (TypeScript) UIs, and AI-powered talent matching features.",
    },
    {
        question: "Where do you work?",
        answer:
            "I'm a Full Stack Developer on QuickRekruit, an EU startup project, since Jan 2026 — building REST APIs with Node/Express/PostgreSQL, React (TypeScript) UIs, and AI-powered talent matching features.",
    },
    {
        question: "What's your current job?",
        answer:
            "I'm a Full Stack Developer on QuickRekruit, an EU startup project, since Jan 2026 — building REST APIs with Node/Express/PostgreSQL, React (TypeScript) UIs, and AI-powered talent matching features.",
    },
    {
        question: "Tell me about your work experience",
        answer:
            "I'm a Full Stack Developer on QuickRekruit, an EU startup project, since Jan 2026 — building REST APIs with Node/Express/PostgreSQL, React (TypeScript) UIs, and AI-powered talent matching features.",
    },

    // Fresher or experienced
    {
        question: "Are you a fresher or experienced?",
        answer:
            "I started as an intern on QuickRekruit and was converted to a full-time Full Stack Developer role, so I have hands-on production experience alongside my MCA studies.",
    },
    {
        question: "How many years of experience do you have?",
        answer:
            "I started as an intern on QuickRekruit and was converted to a full-time Full Stack Developer role, so I have hands-on production experience alongside my MCA studies.",
    },
    {
        question: "Are you a beginner?",
        answer:
            "I started as an intern on QuickRekruit and was converted to a full-time Full Stack Developer role, so I have hands-on production experience alongside my MCA studies.",
    },

    // Projects
    {
        question: "What projects have you built?",
        answer:
            "A few: NearNest (local business discovery platform with AI search), RailwayReady (AI-generated MCQ practice app), and a bilingual membership registration system for KHRA. Links are on my portfolio.",
    },
    {
        question: "Show me your projects",
        answer:
            "A few: NearNest (local business discovery platform with AI search), RailwayReady (AI-generated MCQ practice app), and a bilingual membership registration system for KHRA. Links are on my portfolio.",
    },
    {
        question: "What have you worked on?",
        answer:
            "A few: NearNest (local business discovery platform with AI search), RailwayReady (AI-generated MCQ practice app), and a bilingual membership registration system for KHRA. Links are on my portfolio.",
    },

    // Certifications
    {
        question: "What certifications do you have?",
        answer:
            "HTML & CSS (Udemy), Node.js (Udemy), and N8N Automation Tool (Analytics Vidhya).",
    },
    {
        question: "Any courses you've completed?",
        answer:
            "HTML & CSS (Udemy), Node.js (Udemy), and N8N Automation Tool (Analytics Vidhya).",
    },

    // Why hire you
    {
        question: "Why should we hire you?",
        answer:
            "I combine solid full-stack fundamentals with growing AI/ML expertise, and I use AI tools to ship faster without cutting corners on code quality — I've already proven this shipping real features on a live startup product.",
    },
    {
        question: "What makes you a good fit?",
        answer:
            "I combine solid full-stack fundamentals with growing AI/ML expertise, and I use AI tools to ship faster without cutting corners on code quality — I've already proven this shipping real features on a live startup product.",
    },

    // Notice period / availability
    {
        question: "What's your notice period?",
        answer:
            "This depends on my current commitments — I've noted your question and will follow up with specifics.",
    },
    {
        question: "When can you join?",
        answer:
            "This depends on my current commitments — I've noted your question and will follow up with specifics.",
    },
    {
        question: "Are you available immediately?",
        answer:
            "This depends on my current commitments — I've noted your question and will follow up with specifics.",
    },

    // Relocation
    {
        question: "Are you open to relocation?",
        answer:
            "I'm open to both remote work and relocation depending on the opportunity.",
    },
    {
        question: "Can you work remotely?",
        answer:
            "I'm open to both remote work and relocation depending on the opportunity.",
    },

    // Salary expectations
    {
        question: "What's your expected salary?",
        answer:
            "This depends on the role and responsibilities — happy to discuss specifics directly, feel free to leave your email and I'll follow up.",
    },
    {
        question: "What are your salary expectations?",
        answer:
            "This depends on the role and responsibilities — happy to discuss specifics directly, feel free to leave your email and I'll follow up.",
    },

    // Contact
    {
        question: "How can I contact you?",
        answer:
            "You can email me at gopimathilakath@gmail.com or reach out via LinkedIn — links are on my portfolio.",
    },
    {
        question: "What's your email?",
        answer:
            "You can email me at gopimathilakath@gmail.com or reach out via LinkedIn — links are on my portfolio.",
    },
    {
        question: "How do I reach you?",
        answer:
            "You can email me at gopimathilakath@gmail.com or reach out via LinkedIn — links are on my portfolio.",
    },
];

async function seed() {
    console.log(`Seeding ${qaPairs.length} known answers...`);

    for (const { question, answer } of qaPairs) {
        try {
            const embedding = await getEmbedding(question);
            const vectorString = `[${embedding.join(",")}]`;

            await pool.query(
                `INSERT INTO known_answers (question, answer, embedding) VALUES ($1, $2, $3)`,
                [question, answer, vectorString]
            );

            console.log(`Inserted: "${question}"`);
        } catch (err) {
            console.error(`Failed to insert "${question}":`, err.message);
        }
    }

    console.log("Seeding complete.");
    await pool.end();
}

seed();