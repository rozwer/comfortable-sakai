import { Course } from "../../course/types";
import { EntityProtocol, EntryProtocol } from "../type";
import { saveAssignmentEntry } from "./saveAssignment";

/**
 * -----------------------------------------------------------------
 * Modified by: roz
 * Date       : 2025-05-19
 * Changes    : 課題エントリークラスに提出状態関連フィールドを追加
 * Category   : クラス拡張
 * -----------------------------------------------------------------
 */
export class AssignmentEntry implements EntryProtocol {
    constructor(
        public id: string,
        public title: string,
        public dueTime: number,
        public closeTime: number,
        public hasFinished: boolean,
        public openTimeString?: string,
        public submitted?: boolean,
        public allowResubmitNumber?: string,
        public checkTimestamp?: string  // チェック時のタイムスタンプを保存
    ) {}

    getTimestamp(currentTime: number, showLateAcceptedEntry: boolean): number {
        if (showLateAcceptedEntry) {
            const closestTimestamp = Math.min(this.getCloseDateTimestamp, this.getDueDateTimestamp);
            if (closestTimestamp < currentTime) {
                return this.getCloseDateTimestamp;
            } else {
                return closestTimestamp;
            }
        } else {
            return this.getDueDateTimestamp;
        }
    }

    get getDueDateTimestamp(): number {
        return this.dueTime;
    }

    get getCloseDateTimestamp(): number {
        return this.closeTime;
    }

    getID(): string {
        return this.id;
    }

    getDueDate(showLate: boolean): number {
        return showLate ? this.closeTime : this.dueTime;
    }

    getCloseDate(): number {
        return this.closeTime;
    }

    isDuePassed(currentTime: number): boolean {
        return currentTime > this.dueTime;
    }

    save(hostname: string): Promise<void> {
        return saveAssignmentEntry(hostname, this);
    }
}

export class Assignment implements EntityProtocol {
    constructor(public course: Course, public entries: Array<AssignmentEntry>, public isRead: boolean) {}

    getEntries(): AssignmentEntry[] {
        return this.entries;
    }

    getCourse(): Course {
        return this.course;
    }

    getEntriesMap(): Map<string, AssignmentEntry> {
        return this.entries.reduce((map, entry) => {
            return map.set(entry.id, entry);
        }, new Map<string, AssignmentEntry>());
    }
}
