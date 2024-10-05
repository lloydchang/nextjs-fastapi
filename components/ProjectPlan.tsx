// components/ProjectPlan.tsx

import React, { useEffect, useState } from 'react';
import styles from '../styles/ProjectPlan.module.css';

interface ProjectPlanProps {
  messages: string[];
}

const ProjectPlan: React.FC<ProjectPlanProps> = ({ messages }) => {
  const [planContent, setPlanContent] = useState({
    identity: "Wooden Grain Toys manufactures high-quality hardwood toys for children aged 3-10.",
    problem: "Parents and grandparents are looking for high-quality durable toys that will entertain kids and foster creativity.",
    solution: "Our handcrafted toys are made from solid hardwoods and are designed with sufficient moving parts to engage young children without limiting imagination.",
    targetMarket: "The target audience is adults, specifically parents and grandparents, who wish to give toys to their children or grandchildren.",
    competition: "Large companies like Plastique Toys and Metal Happy Toys sell internationally. Smaller companies sell locally in shops, craft fairs, or online.",
    revenueStreams: "Wooden Grain Toys will sell directly to customers at craft fairs and online.",
    marketingActivities: "Email newsletters, targeted Google and Facebook ads, social media, and in-person sales at craft fairs.",
    expenses: "Materials for toys, craft fair fees, travel costs, and inventory space for products.",
    teamAndKeyRoles: "Currently, the only team member is the owner, Andrew Robertson. As profits increase, Wooden Grain Toys will add an employee to assist with social media and online marketing.",
    milestones: "As the project grows, Wooden Grain Toys will advertise in target markets—especially in advance of the holiday season.",
  });

  useEffect(() => {
    // Placeholder logic for future dynamic updates using messages
    console.log("Messages updated, plan can be adjusted based on new content.");
  }, [messages]);

  return (
    <div className={styles.planContainer}>
      <h1 className={styles.planTitle}>Project Plan</h1>
      
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Identity</h2>
        <p>{planContent.identity}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Problem</h2>
        <p>{planContent.problem}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Solution</h2>
        <p>{planContent.solution}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Target Market</h2>
        <p>{planContent.targetMarket}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Competition</h2>
        <p>{planContent.competition}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Revenue Streams</h2>
        <p>{planContent.revenueStreams}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Marketing Activities</h2>
        <p>{planContent.marketingActivities}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Expenses</h2>
        <p>{planContent.expenses}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Team and Key Roles</h2>
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
