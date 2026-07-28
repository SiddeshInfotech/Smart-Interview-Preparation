// Pricing.jsx
import React, { useState } from 'react';
import '../styles/Pricing.css';

const Pricing = () => {
  const [freeButtonClicked, setFreeButtonClicked] = useState(false);

  const handleFreeClick = () => {
    setFreeButtonClicked(true);
  };

  const plans = [
    {
      name: 'Free',
      price: '$0/month',
      description: 'Perfect for getting started with basic preparation and getting a feel for the platform.',
      features: [
        'Quiz questions (practice mode): 20 per day',
        'Coding questions: 20 per day',
        'Resume analysis: 5 per month',
        'Interview session limit: 30 minutes',
        'Priority support: Not included',
      ],
      buttonText: 'Get Started',
      buttonClass: freeButtonClicked ? 'btn-free-clicked' : 'btn-secondary',
      onClick: handleFreeClick,
    },
    {
      name: 'Premium',
      price: '$29/month',
      description: 'Comprehensive tools and advanced analytics for serious FAANG-track candidates.',
      features: [
        'Quiz questions (practice mode): Unlimited',
        'Coding questions: Unlimited',
        'Resume analysis: Unlimited',
        'Interview session limit: Up to 90 minutes',
        'Priority support: Included',
      ],
      buttonText: 'Go Premium',
      buttonClass: 'btn-primary',
      isPopular: true,
      onClick: () => alert('Upgrade to Premium!'),
    },
  ];

  return (
    <div className="pricing-container">
      <header className="pricing-header">
        <h1>
          {/* Emoji is now separate with a solid color */}
          <span className="rocket-icon">🚀</span>
          <span className="gradient-text"> Accelerate your career with intelligent coaching</span>
        </h1>
        <p>Choose the perfect plan to master your technical interviews and land your dream job at top-tier companies.</p>
      </header>
      <div className="pricing-cards">
        {plans.map((plan, index) => (
          <div className={`pricing-card ${plan.isPopular ? 'popular' : ''}`} key={index}>
            {plan.isPopular && <span className="popular-badge">🌟 Popular</span>}
            <h2 className="plan-name">{plan.name}</h2>
            <div className="plan-price">{plan.price}</div>
            <p className="plan-description">{plan.description}</p>
            <ul className="feature-list">
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <span className="checkmark">✓</span> {feature}
                </li>
              ))}
            </ul>
            <button className={`plan-btn ${plan.buttonClass}`} onClick={plan.onClick}>
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;