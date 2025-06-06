import { Course } from "../../course/types";
import { EntityProtocol, EntryProtocol } from "../type";
import { saveMemoEntry } from "./saveMemo";

/**
 * -----------------------------------------------------------------
 * Modified by: roz
 * Date       : 2025-05-28
 * Changes    : メモエントリークラスにチェックタイムスタンプ追加とメソッドシグネチャ統一
 * Category   : クラス拡張
 * -----------------------------------------------------------------
 */
export class MemoEntry implements EntryProtocol {
    constructor(public id: string, public title: string, public dueTime: number, public hasFinished: boolean, public checkTimestamp?: string) {
    }

    getID(): string {
        return this.id;
    }

    getDueDate(showLate?: boolean): number {
        return this.dueTime;
    }

    getCloseDate(): number {
        return this.dueTime;
    }

    getTimestamp(currentTime?: number, showLateAcceptedEntry?: boolean): number {
        return this.getDueDateTimestamp;
    }

    get getDueDateTimestamp(): number {
        return this.dueTime;
    }

    render(): [React.Component<{}, {}, any>, number][] {
        throw "aa";
    }

    save(hostname: string): Promise<void> {
        return saveMemoEntry(hostname, this);
    }
};


export class Memo implements EntityProtocol {
    readonly isRead = true;

    constructor(public course: Course, public entries: Array<MemoEntry>) {
    }

    getEntries(): MemoEntry[] {
        return this.entries;
    }

    getCourse(): Course {
        return this.course;
    }

    render(): [React.Component<{}, {}, any>, number][] {
        return this.entries.map(e => e.render()).reduce((acc, val) => acc.concat(val), []);
    }

    getEntriesMap(): Map<string, MemoEntry> {
        return this.entries.reduce((map, entry) => {
            return map.set(entry.id, entry);
        }, new Map<string, MemoEntry>());
    }
};
