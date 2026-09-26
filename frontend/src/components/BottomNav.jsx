import React from 'react';
import { ShoppingCart, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <div className="bottom-nav-container">
      <div className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/home')}>
          <ShoppingCart size={28} color="var(--icon-color)" />
        </button>
        
        <button className="nav-item fab-button" onClick={() => navigate('/import')}>
          <div className="fab-inner">
            <Plus size={32} color="white" />
          </div>
        </button>
        
        <button className="nav-item">
          <User size={28} color="var(--icon-color)" />
        </button>
      </div>
    </div>
  );
}
