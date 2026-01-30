import { NavLink } from 'react-router-dom';
import './Navigation.css';

export default function Navigation() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/wardrobe" className="nav-item">
                <i className='bx bx-hanger nav-icon'></i>
                <span className="nav-label">Wardrobe</span>
            </NavLink>

            <NavLink to="/generate" className="nav-item">
                <i className='bx bx-sparkles nav-icon'></i>
                <span className="nav-label">Generate</span>
            </NavLink>

            <NavLink to="/history" className="nav-item">
                <i className='bx bx-history nav-icon'></i>
                <span className="nav-label">History</span>
            </NavLink>

            <NavLink to="/shop" className="nav-item">
                <i className='bx bx-shopping-bag nav-icon'></i>
                <span className="nav-label">Shop</span>
            </NavLink>
        </nav>
    );
}
