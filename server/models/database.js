const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../workout_tracker.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database.');
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createWorkoutsTable = `
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        workout_data TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    const createWorkoutPlansTable = `
      CREATE TABLE IF NOT EXISTS workout_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        plan_data TEXT NOT NULL,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createUsersTable);
    this.db.run(createWorkoutsTable);
    this.db.run(createWorkoutPlansTable);
  }

  // User methods
  createUser(username, passwordHash) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
      stmt.run(username, passwordHash, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username });
        }
      });
      stmt.finalize();
    });
  }

  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id, username, created_at FROM users WHERE id = ?', id, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Workout methods
  saveWorkout(userId, date, workoutData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('INSERT INTO workouts (user_id, date, workout_data) VALUES (?, ?, ?)');
      stmt.run(userId, date, JSON.stringify(workoutData), function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, userId, date, workoutData });
        }
      });
      stmt.finalize();
    });
  }

  getWorkoutsByUser(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT ?',
        [userId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const workouts = rows.map(row => ({
              ...row,
              workout_data: JSON.parse(row.workout_data)
            }));
            resolve(workouts);
          }
        }
      );
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

module.exports = new Database();