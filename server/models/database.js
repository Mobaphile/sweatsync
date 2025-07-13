const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../workout_tracker.db");

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to SQLite database.");
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
        user_id INTEGER NOT NULL,  -- ADD THIS LINE
        name TEXT NOT NULL,
        plan_data TEXT NOT NULL,    
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)  -- ADD THIS LINE
      )
    `;

    this.db.run(createUsersTable);
    this.db.run(createWorkoutsTable);
    this.db.run(createWorkoutPlansTable);
  }

  // User methods
  createUser(username, passwordHash) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)"
      );
      stmt.run(username, passwordHash, function (err) {
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
      this.db.get(
        "SELECT * FROM users WHERE username = ?",
        username,
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT id, username, created_at FROM users WHERE id = ?",
        id,
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // Workout methods
  saveWorkout(userId, date, workoutData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(
        "INSERT INTO workouts (user_id, date, workout_data) VALUES (?, ?, ?)"
      );
      stmt.run(userId, date, JSON.stringify(workoutData), function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, userId, date, workoutData });
        }
      });
      stmt.finalize();
    });
  }

  deleteWorkout(workoutId, userId) {
    return new Promise((resolve, reject) => {
      // First, verify that the workout belongs to the user
      this.db.get(
        "SELECT id FROM workouts WHERE id = ? AND user_id = ?",
        [workoutId, userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            reject(new Error("Workout not found or access denied"));
            return;
          }

          // If workout exists and belongs to user, delete it
          this.db.run(
            "DELETE FROM workouts WHERE id = ? AND user_id = ?",
            [workoutId, userId],
            function (err) {
              if (err) {
                reject(err);
              } else {
                resolve({
                  deleted: true,
                  workoutId: workoutId,
                  changesCount: this.changes,
                });
              }
            }
          );
        }
      );
    });
  }

  getWorkoutsByUser(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT ?",
        [userId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const workouts = rows.map((row) => ({
              ...row,
              workout_data: JSON.parse(row.workout_data),
            }));
            resolve(workouts);
          }
        }
      );
    });
  }

  // User Workout Plan methods
  saveUserWorkoutPlan(userId, name, planData) {
    return new Promise((resolve, reject) => {
      // First, set all existing plans for this user to inactive
      const deactivateStmt = this.db.prepare(
        "UPDATE workout_plans SET active = 0 WHERE user_id = ?"
      );
      deactivateStmt.run(userId, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Now insert the new plan as active
        const insertStmt = this.db.prepare(`
          INSERT INTO workout_plans (user_id, name, plan_data, active) 
          VALUES (?, ?, ?, 1)
        `);
        insertStmt.run(userId, name, JSON.stringify(planData), function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              userId,
              name,
              planData,
              active: true,
            });
          }
        });
        insertStmt.finalize();
      });
      deactivateStmt.finalize();
    });
  }

  getUserWorkoutPlan(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM workout_plans WHERE user_id = ? AND active = 1",
        userId,
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve({
              ...row,
              plan_data: JSON.parse(row.plan_data),
            });
          } else {
            resolve(null); // No active plan found
          }
        }
      );
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed.");
      }
    });
  }
}

module.exports = new Database();
