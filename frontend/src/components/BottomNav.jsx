import React from 'react';
import { ShoppingCart, Plus, User } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  return (
    <div className="bottom-nav-container">
      <div className="bottom-nav">
        <button className="nav-item">
          <ShoppingCart size={28} color="var(--icon-color)" />
        </button>
        
        <button className="nav-item fab-button">
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
