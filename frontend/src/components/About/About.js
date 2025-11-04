import React from 'react';
import styles from './About.module.css';

const About = () => {
  return (
    <section className={styles.about}>
      <p className={styles.text}>
        We are the bridge between you and a better community. Our platform
        transforms public concern into measurable action, ensuring every reported
        issue is reviewed diligently and decisively resolved. Your voice drives our
        collective progress.
      </p>
    </section>
  );
};

export default About;