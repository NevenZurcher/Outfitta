import { Link } from 'react-router-dom';
import './ProfileButton.css';

export default function ProfileButton({ user }) {
    return (
        <Link to="/profile" className="btn btn-ghost btn-icon profile-btn" title="Profile">
            {user && user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="profile-img-tiny" />
            ) : (
                <i className='bx bx-user'></i>
            )}
        </Link>
    );
}
