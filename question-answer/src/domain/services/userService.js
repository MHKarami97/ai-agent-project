/**
 * User Service
 */
import { UserRepository } from '../../data/repositories/userRepository.js';
import { User } from '../models/user.js';
import { validateUser } from '../../core/validation.js';
import { logger } from '../../core/logger.js';

export class UserService {
    constructor() {
        this.repository = new UserRepository();
    }

    /**
     * Get all users
     * @returns {Promise<Array<User>>}
     */
    async getAllUsers() {
        const users = await this.repository.findAll();
        return users.map(u => new User(u));
    }

    /**
     * Get user by ID
     * @param {number} id - User ID
     * @returns {Promise<User|null>}
     */
    async getUserById(id) {
        const user = await this.repository.findById(id);
        return user ? new User(user) : null;
    }

    /**
     * Get user by username
     * @param {string} username - Username
     * @returns {Promise<User|null>}
     */
    async getUserByUsername(username) {
        const user = await this.repository.findByUsername(username);
        return user ? new User(user) : null;
    }

    /**
     * Create or get user (for login)
     * @param {string} username - Username
     * @returns {Promise<User>}
     */
    async loginOrCreateUser(username) {
        validateUser({ username });
        
        let user = await this.getUserByUsername(username);
        
        if (!user) {
            // Create new user with Employee role
            const userData = {
                username: username.trim(),
                displayName: username.trim(),
                role: 'Employee'
            };
            const created = await this.repository.create(userData);
            user = new User(created);
            logger.info('New user created:', user);
        }
        
        return user;
    }

    /**
     * Create user (admin only)
     * @param {Object} userData - User data
     * @returns {Promise<User>}
     */
    async createUser(userData) {
        validateUser(userData);
        const created = await this.repository.create(userData);
        return new User(created);
    }

    /**
     * Update user
     * @param {number} id - User ID
     * @param {Object} updates - Update data
     * @returns {Promise<User>}
     */
    async updateUser(id, updates) {
        if (updates.username) {
            validateUser(updates);
        }
        const updated = await this.repository.update(id, updates);
        return new User(updated);
    }

    /**
     * Delete user
     * @param {number} id - User ID
     * @returns {Promise<void>}
     */
    async deleteUser(id) {
        return this.repository.delete(id);
    }
}
