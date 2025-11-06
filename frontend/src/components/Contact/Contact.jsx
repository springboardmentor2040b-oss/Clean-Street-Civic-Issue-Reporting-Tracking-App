import React from 'react';
import styles from './Contact.module.css';
import contactImage from '../../assets/contact-us.png';

const Contact = () => {
  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          <img src={contactImage} alt="Contact Us" className={styles.image} />
        </div>
        <form className={styles.form}>
          <input type="email" placeholder="E-mail" className={styles.input} />
          <textarea placeholder="Enter your message here" className={styles.textarea}></textarea>
          <button type="submit" className={styles.button}>SEND</button>
        </form>
      </div>
    </section>
  );
};

export default Contact;