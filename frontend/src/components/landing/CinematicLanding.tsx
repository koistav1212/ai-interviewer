'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import styles from './CinematicLanding.module.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function CinematicLanding() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const scenes = gsap.utils.toArray('.scene') as HTMLElement[];
    
    // Core timeline for 8 scenes (8000px scroll depth)
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: '+=8000', 
      pin: true,
      animation: gsap.timeline()
        // Scene 1 -> 2 (Context)
        .to('.scene1', { opacity: 0, scale: 1.05, duration: 1 })
        .to('.scene2', { opacity: 1, visibility: 'visible', duration: 1 }, '<')
        .fromTo('.scene2 .anim-el', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 1 }, '<0.2')
        
        // Scene 2 -> 3 (Understand)
        .to('.scene2', { opacity: 0, filter: 'blur(10px)', duration: 1 }, '+=0.5')
        .to('.scene3', { opacity: 1, visibility: 'visible', duration: 1 }, '<')
        .fromTo('.scene3 .anim-el', { x: -30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.15, duration: 1 }, '<0.2')
        
        // Scene 3 -> 4 (Connect)
        .to('.scene3', { opacity: 0, y: -50, duration: 1 }, '+=0.5')
        .to('.scene4', { opacity: 1, visibility: 'visible', duration: 1 }, '<')
        .fromTo('.scene4 .anim-el', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 1 }, '<0.2')
        
        // Scene 4 -> 5 (Retrieve)
        .to('.scene4', { opacity: 0, scale: 0.95, duration: 1 }, '+=0.5')
        .to('.scene5', { opacity: 1, visibility: 'visible', duration: 1 }, '<')
        .fromTo('.scene5 .anim-el', { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.15, duration: 1 }, '<0.2')
        
        // Scene 5 -> 6 (Reason)
        .to('.scene5', { opacity: 0, filter: 'blur(10px)', duration: 1 }, '+=0.5')
        .to('.scene6', { opacity: 1, visibility: 'visible', duration: 1 }, '<')
        .fromTo('.scene6 .anim-el', { y: -30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 1 }, '<0.2')

        // Scene 6 -> 7 (Adapt)
        .to('.scene6', { opacity: 0, y: 50, duration: 1 }, '+=0.5')
        .to('.scene7', { opacity: 1, visibility: 'visible', duration: 1 }, '<')
        .fromTo('.scene7 .anim-el', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.2, duration: 1 }, '<0.2')
        
        // Scene 7 -> 8 (Reveal)
        .to('.scene7', { opacity: 0, filter: 'blur(20px)', duration: 1 }, '+=0.5')
        .to('.scene8', { opacity: 1, visibility: 'visible', duration: 1 }, '<')
        .fromTo('.scene8 .anim-el', { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.2, duration: 1 }, '<0.2'),
      scrub: 1,
    });

    // Sub-parallax inside scenes
    scenes.forEach((scene) => {
      const char = scene.querySelector(`.${styles['hero-character']}`);
      const bg = scene.querySelector('img:not([class*="hero-character"])');
      const fgText = scene.querySelectorAll('.anim-text');
      const cards = scene.querySelectorAll('.prx-card');
      
      if (bg) {
        gsap.to(bg, {
          scale: 1.1,
          ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
      if (char) {
        gsap.to(char, {
          yPercent: -10,
          ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
      if (fgText.length) {
        gsap.to(fgText, {
          yPercent: -15,
          ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
      if (cards.length) {
        gsap.to(cards, {
          yPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={styles.hero}>
      
      {/* ---------------- NAVIGATION ---------------- */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>TalentIQ</div>
        <div className={styles['nav-actions']}>
          <Link href="/login" className={`${styles['nav-button']} ${styles.secondary}`}>Login</Link>
          <Link href="/signup" className={`${styles['nav-button']} ${styles.primary}`}>Start Hiring</Link>
        </div>
      </nav>

      {/* ---------------- SCENE 1: DISCOVER ---------------- */}
      <section className={`scene scene1 ${styles.scene} ${styles.active}`}>
        <div className={styles['hero-visual']}>
          <div className={styles['overlay-gradient']} />
        </div>
        
        <img src="/assets/b9d277fd-8154-4f6c-80e6-b41d032501a0.png" alt="Candidate" className={styles['hero-character']} />

        <div className={styles['hero-inner']}>
          <div className={styles['hero-tags']}>
            <button className={`${styles['floating-node']} ${styles['tag-skills']}`}><span>✦</span> SKILLS</button>
            <button className={`${styles['floating-node']} ${styles['tag-experience']}`}><span>◉</span> EXPERIENCE</button>
            <button className={`${styles['floating-node']} ${styles['tag-potential']}`}><span>↗</span> POTENTIAL</button>
            <button className={`${styles['floating-node']} ${styles['tag-context']}`}><span>◈</span> CONTEXT</button>
            <button className={`${styles['floating-node']} ${styles['tag-reasoning']}`}><span>◌</span> REASONING</button>
            <button className={`${styles['floating-node']} ${styles['tag-adaptability']}`}><span>⌁</span> ADAPTABILITY</button>
            <button className={`${styles['floating-node']} ${styles['tag-impact']}`}><span>◆</span> IMPACT</button>
            <button className={`${styles['floating-node']} ${styles['tag-growth']}`}><span>↑</span> GROWTH</button>
          </div>
          
          <div className={styles['hero-content']}>
            <div className="anim-text">
              <h1 className={styles['hero-title']}>Hiring<br />Intelligence,<br />Reimagined.</h1>
              <p className={styles['hero-subtitle']}>See beyond the resume.</p>
            </div>
            <div style={{ position: 'absolute', bottom: '24px', left: 0 }} className={styles.label}>
              01 / 08 — DISCOVER
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SCENE 2: CONTEXT ---------------- */}
      <section className={`scene scene2 ${styles.scene}`}>
        <div className={styles['hero-visual']}>
          <img src="/assets/5149107a-efab-4078-a01b-06d16c153a9f.png" alt="Context" style={{ opacity: 0.5, objectPosition: 'left center' }} />
          <div className={styles['overlay-gradient']} style={{ background: 'linear-gradient(270deg, rgba(7,11,22,0.95) 0%, rgba(7,11,22,0.5) 50%, rgba(7,11,22,0.9) 100%)' }} />
        </div>

        <div className={styles['hero-inner']}>
          <div className={styles['hero-content']} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div className={`anim-text ${styles['scene-text-left']}`}>
              <h2 className={styles['hero-title']}>Context Changes<br />Everything.</h2>
              <p className={styles['hero-subtitle']}>The same experience can mean something completely different depending on the role, company, and problem being solved.</p>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '24px', right: 0 }} className={styles.label}>02 / 08 — CONTEXT</div>
        </div>
      </section>

      {/* ---------------- SCENE 3: UNDERSTAND ---------------- */}
      <section className={`scene scene3 ${styles.scene}`}>
        <div className={styles['hero-visual']}>
          <img src="/assets/9fd62786-ac81-4e1a-8b77-e7c3bdaca386.png" alt="Resume Extract" style={{ opacity: 0.3 }} />
          <div className={styles['overlay-vignette']} />
        </div>

        <div className={styles['hero-inner']}>
          <div className={styles['hero-content']} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 className={`${styles['hero-title']} anim-el ${styles['scene-text-center']}`} style={{ marginBottom: '60px' }}>We Don't Just<br />Read Resumes.</h2>
            
            <div className={`anim-el ${styles['stack-responsive']}`}>
              <div className={`${styles['glass-card']} ${styles['card-responsive']}`} style={{ textAlign: 'center' }}>
                <div className={styles.label}>YOUR EXPERIENCE</div>
                <div style={{ fontSize: '18px', marginTop: '8px' }}>RESUME.pdf</div>
              </div>
              <div className={styles['plus-sign']}>+</div>
              <div className={`${styles['glass-card']} ${styles['card-responsive']}`} style={{ textAlign: 'center' }}>
                <div className={styles.label}>THE OPPORTUNITY</div>
                <div style={{ fontSize: '18px', marginTop: '8px' }}>Senior Data Analyst<br/>Job Description</div>
              </div>
            </div>

            <div className="anim-el" style={{ margin: '32px 0', color: '#3DDCFF', fontSize: '24px' }}>↓</div>

            <div className="anim-el prx-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', maxWidth: '600px' }}>
              {['Python', 'SQL', 'XGBoost', 'Leadership', 'Product Analytics', 'Machine Learning'].map(skill => (
                <span key={skill} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', fontSize: '14px', background: 'rgba(255,255,255,0.05)' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '24px', left: 0 }} className={styles.label}>03 / 08 — UNDERSTAND</div>
        </div>
      </section>

      {/* ---------------- SCENE 4: CONNECT ---------------- */}
      <section className={`scene scene4 ${styles.scene}`}>
        <div className={styles['hero-visual']}>
          <img src="/assets/5561561a-89ce-44da-8cc7-be2dd0d2774e.png" alt="Vector Network" style={{ opacity: 0.2, filter: 'contrast(1.5)' }} />
          <div className={styles['overlay-vignette']} />
        </div>

        <div className={styles['hero-inner']}>
          <div className={styles['hero-content']} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <div className={`anim-text ${styles['scene-text-left']}`}>
              <h2 className={styles['hero-title']}>Everything<br />Becomes<br />Connected.</h2>
              <div className={`anim-el prx-card ${styles['stack-responsive']}`} style={{ marginTop: '40px' }}>
                <div className={`${styles['glass-card']} ${styles['card-responsive']}`} style={{ borderTop: '2px solid #3DDCFF' }}>
                  <div className={styles.label}>Resume</div>
                  <div style={{ margin: '8px 0', color: 'rgba(255,255,255,0.5)' }}>↓</div>
                  <div>Embeddings</div>
                  <div style={{ margin: '8px 0', color: 'rgba(255,255,255,0.5)' }}>↓</div>
                  <div style={{ color: '#3DDCFF' }}>Vector DB</div>
                </div>
                <div className={`${styles['glass-card']} ${styles['card-responsive']}`} style={{ borderTop: '2px solid rgba(255,255,255,0.5)' }}>
                  <div className={styles.label}>Job Req</div>
                  <div style={{ margin: '8px 0', color: 'rgba(255,255,255,0.5)' }}>↓</div>
                  <div>Embeddings</div>
                  <div style={{ margin: '8px 0', color: 'rgba(255,255,255,0.5)' }}>↓</div>
                  <div style={{ color: '#3DDCFF' }}>Retrieval Space</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '24px', right: 0 }} className={styles.label}>04 / 08 — CONNECT</div>
        </div>
      </section>

      {/* ---------------- SCENE 5: RETRIEVE ---------------- */}
      <section className={`scene scene5 ${styles.scene}`}>
        <div className={styles['hero-visual']}>
          <img src="/assets/f745f422-9719-4993-bd24-dac6ef7147f6.png" alt="Retrieve" className={styles['hero-character']} style={{ right: 'auto', left: '-5%', opacity: 0.6 }} />
          <div className={styles['overlay-gradient']} style={{ background: 'linear-gradient(270deg, rgba(7,11,22,0.95) 0%, rgba(7,11,22,0.3) 60%, rgba(7,11,22,0.9) 100%)' }} />
        </div>

        <div className={styles['hero-inner']}>
          <div className={styles['hero-content']} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            <h2 className={`${styles['hero-title']} anim-text ${styles['scene-text-right']}`}>Ask Better<br />Questions.</h2>
            
            <div className={`anim-el prx-card ${styles['w-full-max']}`} style={{ marginTop: '40px', textAlign: 'left' }}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px' }}>
                <div className={styles.label}>QUERY</div>
                <div style={{ fontSize: '18px', marginTop: '8px' }}>"What should we explore next?"</div>
              </div>
              
              <div className={styles.label} style={{ marginBottom: '16px' }}>RETRIEVING CONTEXT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Credit Risk Project', 'Python Implementation', 'Business Impact', 'Model Evaluation'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#3DDCFF' }}>✓</div>
                    <div style={{ fontSize: '15px' }}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '24px', left: 0 }} className={styles.label}>05 / 08 — RETRIEVE</div>
        </div>
      </section>

      {/* ---------------- SCENE 6: REASON ---------------- */}
      <section className={`scene scene6 ${styles.scene}`}>
        <div className={styles['hero-visual']}>
          <div className={styles['overlay-vignette']} style={{ background: 'radial-gradient(circle at center, rgba(7,11,22,0.6) 0%, rgba(7,11,22,1) 100%)' }} />
        </div>

        <div className={styles['hero-inner']}>
          <div className={styles['hero-content']} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 className={`${styles['hero-title']} anim-text ${styles['scene-text-center']}`} style={{ marginBottom: '60px' }}>Intelligence Behind<br />Every Question.</h2>
            
            <div className={`anim-el prx-card ${styles['stack-responsive']} ${styles.center}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
                <div className={styles.label}>Context</div>
                <div className={styles.label}>Previous Answer</div>
                <div className={styles.label}>Role Requirement</div>
                <div className={styles.label}>Candidate Profile</div>
              </div>
              
              <div className={styles['plus-sign']}>+</div>
              
              <div className={`${styles['glass-card']} ${styles['card-responsive']}`} style={{ textAlign: 'center', padding: '32px', border: '1px solid #3DDCFF', boxShadow: '0 0 40px rgba(61,220,255,0.1)' }}>
                <div className={styles.label} style={{ color: '#3DDCFF', fontSize: '14px' }}>LLM REASONING CORE</div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  <span>ANALYZING</span>
                  <span>REASONING</span>
                  <span>ADAPTING</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '24px', right: 0 }} className={styles.label}>06 / 08 — REASON</div>
        </div>
      </section>

      {/* ---------------- SCENE 7: ADAPT ---------------- */}
      <section className={`scene scene7 ${styles.scene}`}>
        <div className={styles['hero-visual']}>
          <img src="/assets/394ff994-9e5b-4c40-85d8-ff1e04f1835f.jpeg" alt="Interview" className="backgroundImage" style={{ opacity: 0.3 }} />
          <div className={styles['overlay-vignette']} />
        </div>

        <div className={styles['hero-inner']}>
          <div className={styles['hero-content']} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh' }}>
            <h2 className={`${styles['hero-title']} anim-text ${styles['scene-text-center']}`} style={{ marginBottom: '40px' }}>No Two Interviews<br />Should Be The Same.</h2>
            
            <div className="anim-el prx-card" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div className={`${styles['glass-card']} ${styles['diag-card']}`} style={{ alignSelf: 'flex-start', borderLeft: '2px solid rgba(255,255,255,0.2)' }}>
                <div className={styles.label}>TALENTIQ</div>
                <div style={{ fontSize: '18px', marginTop: '8px', lineHeight: 1.5 }}>"You mentioned using XGBoost for credit risk detection. Why did you choose it over logistic regression?"</div>
              </div>

              <div className={`${styles['glass-card']} ${styles['diag-card-center']}`} style={{ alignSelf: 'center', borderLeft: `2px solid #3DDCFF` }}>
                <div className={styles.label} style={{ color: '#3DDCFF' }}>ANSWER ANALYSIS</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '14px' }}><span>Technical Depth</span> <span>82%</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '14px' }}><span>Model Reasoning</span> <span style={{ color: '#3DDCFF' }}>91%</span></div>
              </div>

              <div className={`${styles['glass-card']} ${styles['diag-card']}`} style={{ alignSelf: 'flex-end', borderLeft: '2px solid rgba(255,255,255,0.8)' }}>
                <div className={styles.label}>TALENTIQ FOLLOW-UP</div>
                <div style={{ fontSize: '18px', marginTop: '8px', lineHeight: 1.5 }}>"If the fraud rate suddenly doubled, how would you redesign your evaluation strategy?"</div>
              </div>

            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '24px', left: 0 }} className={styles.label}>07 / 08 — ADAPT</div>
        </div>
      </section>

      {/* ---------------- SCENE 8: REVEAL (FINAL CTA) ---------------- */}
      <section className={`scene scene8 finalScene ${styles.scene}`}>
        <div className={styles['hero-visual']}>
          <img src="/assets/b9d277fd-8154-4f6c-80e6-b41d032501a0.png" alt="Reveal" style={{ opacity: 0.3, transform: 'scale(1.15)', objectPosition: 'center 20%' }} />
          <div className={styles['overlay-vignette']} style={{ background: 'radial-gradient(circle at center, rgba(7,11,22,0.4) 0%, rgba(7,11,22,0.95) 100%)' }} />
        </div>

        <div className={styles['hero-inner']}>
          <div className={styles['hero-content']} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 className={`${styles['hero-title']} anim-text ${styles['scene-text-center']}`}>See What Resumes<br />Cannot.</h2>
            
            <div className="anim-el" style={{ display: 'flex', gap: 'clamp(12px, 2vw, 32px)', margin: '40px 0', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '800px' }}>
              {['Technical Capability', 'Problem Solving', 'Communication', 'Role Alignment', 'Learning Agility', 'Growth Potential'].map(metric => (
                <div key={metric} style={{ fontSize: '16px', color: 'rgba(220,230,245,0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '4px' }}>
                  {metric}
                </div>
              ))}
            </div>

            <div className="anim-el" style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button className={`${styles['nav-button']} ${styles.primary}`} style={{ fontSize: '16px', padding: '16px 32px' }}>Start Hiring →</button>
            </div>
          </div>
          
          <div style={{ position: 'absolute', bottom: '24px', width: '100%', textAlign: 'center' }} className={styles.label}>
            Discover the intelligence behind every candidate.
          </div>
        </div>
      </section>

    </div>
  );
}
