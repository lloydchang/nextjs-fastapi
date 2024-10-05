// components/templates/ProjectPlan.tsx

import React, { useEffect, useState } from 'react';
import styles from '../styles/templates/ProjectPlan.module.css';

interface ProjectPlanProps {
  messages: string[];
}

const ProjectPlan: React.FC<ProjectPlanProps> = ({ messages }) => {
  const [planContent, setPlanContent] = useState({
    identity: "",
    problem: "",
    solution: "",
    targetMarket: "",
    competition: "",
    revenueStreams: "",
    marketingActivities: "",
    expenses: "",
    teamAndKeyRoles: "",
    milestones: "",
  });

  useEffect(() => {
    // Placeholder logic for future dynamic updates using messages
    console.log("Messages updated, plan can be adjusted based on new content.");
  }, [messages]);

  return (
    <div className={styles.planContainer}>
      <h1 className={styles.planTitle}>Project name</h1>
      
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Identity</h2>
        <p>{planContent.identity}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Problem</h2>
        <p>{planContent.problem}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Our solution</h2>
        <p>{planContent.solution}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Target market</h2>
        <p>{planContent.targetMarket}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The competition</h2>
        <p>{planContent.competition}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Revenue streams</h2>
        <p>{planContent.revenueStreams}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Marketing activities</h2>
        <p>{planContent.marketingActivities}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Expenses</h2>
        <p>{planContent.expenses}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Team and key roles</h2>
        <p>{planContent.teamAndKeyRoles}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Milestones</h2>
        <p>{planContent.milestones}</p>
      </section>
    </div>
  );
};

export default ProjectPlan;
