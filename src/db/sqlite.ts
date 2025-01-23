import Database from "better-sqlite3";

export class DB {
    private db: any;

    constructor() {
        this.db = new Database("singular.db");

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS domain_information
            (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                label      TEXT UNIQUE                        NOT NULL,
                expireDate TEXT                               NOT NULL,
                signature  TEXT                               NOT NULL,
                nonce      INTEGER                            NOT NULL,
                deadline   INTEGER                            NOT NULL,
                owner      TEXT                               NOT NULL,
                status     TEXT                               NOT NULL,
                createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updatedAt  DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `);
    }

    insertDomainInformation(label: string, expireDate: string, signature: string, nonce: number, deadline: number, owner: string, status: string) {
        const stmt = this.db.prepare(`
            INSERT INTO domain_information (label, expireDate, signature, nonce, deadline, owner, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        return stmt.run(label, expireDate, signature, nonce, deadline, owner, status);
    }

    getDomainInformation(label: string) {
        const stmt = this.db.prepare(`
            SELECT *
            FROM domain_information
            WHERE label = ?
        `);

        return stmt.get(label);
    }

    updateDomainInformation(label: string, status: string) {
        const stmt = this.db.prepare(`
            UPDATE domain_information
            SET status    = ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE label = ?
        `);

        return stmt.run(status, label);
    }

    getDomainsInList(labels: string[]) {
        const stmt = this.db.prepare(`
            SELECT *
            FROM domain_information
            WHERE label IN (${labels.map(() => "?").join(", ")})
        `);

        return stmt.all(...labels);
    }

}
