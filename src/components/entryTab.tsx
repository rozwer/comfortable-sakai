/**
 * -----------------------------------------------------------------
 * Modified by: roz
 * Date       : 2025-05-28
 * Changes    : 課題ステータス判定ロジック拡張と表示制御機能改善
 * Category   : ロジック拡張
 * -----------------------------------------------------------------
 */
// filepath: /home/rozwer/sakai/comfortable-sakai/src/components/entryTab.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Assignment, AssignmentEntry } from "../features/entity/assignment/types";
import { Course } from "../features/course/types";
import { Memo, MemoEntry } from "../features/entity/memo/types";
import { Quiz, QuizEntry } from "../features/entity/quiz/types";
import { getDaysUntil } from "../utils";
import AssignmentEntryView from "./assignment";
import { useTranslation } from "./helper";
import MemoEntryView from "./memo";
import QuizEntryView from "./quiz";
import { CurrentTime, MaxTimestamp } from "../constant";
import { getSakaiCourses } from "../features/course/getCourse";
import { entries } from "lodash";
import { Settings } from "../features/setting/types";

// Every type in EntityUnion must implement IEntity
export type EntityUnion = Assignment | Quiz | Memo;
// Every type in EntryUnion must implement IEntry
export type EntryUnion = AssignmentEntry | QuizEntry | MemoEntry; // TODO: add Quiz, Memo, ...

export type DueType = "danger" | "warning" | "success" | "other";

function MiniSakaiCourse(props: {
    courseID: string;
    coursePage: string;
    courseName: string;
    entries: EntryUnion[];
    dueType: DueType;
    isSubset: boolean;
    onCheck: (entry: EntryUnion, checked: boolean, requestDate?: boolean) => void;
    onDelete: (entry: EntryUnion) => void;
}) {
    const divClass = useMemo(() => `cs-assignment-${props.dueType}`, [props.dueType]);
    const aClass = useMemo(() => `cs-course-${props.dueType} cs-course-name`, [props.dueType]);

    const elements = useMemo(() => {
        const elems: JSX.Element[] = [];
        for (const entry of props.entries) {
            if (entry instanceof AssignmentEntry) {
                elems.push(
                    <AssignmentEntryView
                        key={entry.getID()}
                        isSubset={props.isSubset}
                        assignment={entry}
                        onCheck={(checked, requestDate) => props.onCheck(entry, checked, requestDate)}
                    />
                );
            } else if (entry instanceof QuizEntry) {
                elems.push(
                    <QuizEntryView
                        key={entry.getID()}
                        isSubset={props.isSubset}
                        quiz={entry}
                        onCheck={(checked, requestDate) => props.onCheck(entry, checked, requestDate)}
                    />
                );
            } else if (entry instanceof MemoEntry) {
                elems.push(
                    <MemoEntryView
                        key={entry.getID()}
                        isSubset={props.isSubset}
                        memo={entry}
                        onCheck={(checked, requestDate) => props.onCheck(entry, checked, requestDate)}
                        onDelete={() => props.onDelete(entry)}
                    />
                );
            }
        }
        return elems;
    }, [props]);

    return (
        // TODO: style
        <div className={divClass}>
            {/* TODO: subset a tag */}
            {props.isSubset ? (
                <div className={aClass}>{props.courseName}</div>
            ) : (
                <a className={aClass} href={props.coursePage}>
                    {props.courseName}
                </a>
            )}

            {elements}
        </div>
    );
}

export type MemoAddInfo = { course: Course; content: string; due: number };

export function EntryTab(props: {
    isSubset: boolean;
    showMemoBox: boolean;
    entities: EntityUnion[];
    settings: Settings;
    onCheck: (entry: EntryUnion, checked: boolean, requestDate?: boolean) => void;
    onDelete: (entry: EntryUnion) => void;
    onMemoAdd: (memo: MemoAddInfo) => void;
}) {
    type EntryWithCourse = {
        entry: EntryUnion;
        course: Course;
    };

    const dangerElements: EntryWithCourse[] = [];
    const warningElements: EntryWithCourse[] = [];
    const successElements: EntryWithCourse[] = [];
    const otherElements: EntryWithCourse[] = [];

    for (const entity of props.entities) {
        const course = entity.getCourse();
        for (const entry of entity.entries) {
            /**
             * -----------------------------------------------------------------
             * Modified by: roz
             * Date       : 2025-05-19
             * Changes    : エントリから追加情報を取得し、課題ステータス判定に利用
             * Category   : ロジック拡張
             * -----------------------------------------------------------------
             */
            // エントリから追加情報を取得
            const entryInfo = {
                openTimeString: (entry as any).openTimeString,
                submitted: (entry as any).submitted,
                checkTimestamp: (entry as any).checkTimestamp
            };
            
            const daysUntilDue = getDaysUntil(
                CurrentTime, 
                entry.getDueDate(props.settings.miniSakaiOption.showLateAcceptedEntry),
                entryInfo
            );

            switch (daysUntilDue) {
                case "due24h":
                    dangerElements.push({
                        entry: entry,
                        course: course
                    });
                    break;
                case "due5d":
                    warningElements.push({
                        entry: entry,
                        course: course
                    });
                    break;
                case "due14d":
                    successElements.push({
                        entry: entry,
                        course: course
                    });
                    break;
                case "dueOver14d":
                    otherElements.push({
                        entry: entry,
                        course: course
                    });
                    break;
                case "notPublished":
                    /**
                     * -----------------------------------------------------------------
                     * Modified by: roz
                     * Date       : 2025-05-19
                     * Changes    : 未公開課題の表示制御を設定に基づいて行うように修正
                     * Category   : ロジック改善
                     * -----------------------------------------------------------------
                     */
                    // 設定で「未公開の課題を非表示にする」がtrueの場合は表示しない
                    // falseの場合は「その他」カテゴリに表示する
                    if (!props.settings.miniSakaiOption.hideUnpublishedAssignments) {
                        otherElements.push({
                            entry: entry,
                            course: course
                        });
                    }
                    break;
                case "submitted":
                    /**
                     * -----------------------------------------------------------------
                     * Modified by: roz
                     * Date       : 2025-05-19
                     * Changes    : 提出済み課題は課題一覧に表示しないように修正
                     * Category   : 表示ロジック変更
                     * -----------------------------------------------------------------
                     */
                    // 提出済み課題は表示しない（課題一覧に表示しない）
                    break;
                case "dismissed":
                    /**
                     * -----------------------------------------------------------------
                     * Added by: roz
                     * Date       : 2025-05-20
                     * Changes    : 非表示課題は課題一覧に表示しないように修正
                     * Category   : 表示ロジック変更
                     * -----------------------------------------------------------------
                     */
                    // 非表示課題は表示しない（課題一覧に表示しない）
                    break;
            }
        }
    }

    return (
        <>
            {props.isSubset ? null : (
                <AddMemoBox
                    shown={!props.isSubset && props.showMemoBox}
                    courses={getSakaiCourses()}
                    onMemoAdd={props.onMemoAdd}
                />
            )}
            {dangerElements.length === 0 ? null : (
                <MiniSakaiEntryList
                    dueType='danger'
                    isSubset={props.isSubset}
                    settings={props.settings}
                    entriesWithCourse={dangerElements}
                    onCheck={props.onCheck}
                    onDelete={props.onDelete}
                />
            )}
            {warningElements.length === 0 ? null : (
                <MiniSakaiEntryList
                    dueType='warning'
                    isSubset={props.isSubset}
                    settings={props.settings}
                    entriesWithCourse={warningElements}
                    onCheck={props.onCheck}
                    onDelete={props.onDelete}
                />
            )}
            {successElements.length === 0 ? null : (
                <MiniSakaiEntryList
                    dueType='success'
                    isSubset={props.isSubset}
                    settings={props.settings}
                    entriesWithCourse={successElements}
                    onCheck={props.onCheck}
                    onDelete={props.onDelete}
                />
            )}
            {otherElements.length === 0 ? null : (
                <MiniSakaiEntryList
                    dueType='other'
                    isSubset={props.isSubset}
                    settings={props.settings}
                    entriesWithCourse={otherElements}
                    onCheck={props.onCheck}
                    onDelete={props.onDelete}
                />
            )}
        </>
    );
}

function AddMemoBox(props: { shown: boolean; courses: Course[]; onMemoAdd: (memo: MemoAddInfo) => void }) {
    const defaultDueDate = (): string => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().substr(0, 16);
    };

    const courseName = useTranslation("todo_box_course_name");
    const memoLabel = useTranslation("todo_box_memo");
    const dueDate = useTranslation("todo_box_due_date");
    const addBtnLabel = useTranslation("todo_box_add");

    const [selectedCourseID, setSelectedCourseID] = useState(props.courses[0]?.id ?? "");
    const [todoContent, setTodoContent] = useState("");
    const [todoDue, setTodoDue] = useState(defaultDueDate);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCourses = useMemo(() => {
        if (!searchQuery.trim()) {
            return props.courses;
        }
        return props.courses.filter(course => 
            course.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [props.courses, searchQuery]);

    // 検索クエリが変更されたときに、選択されたコースIDが現在フィルタリングされたリストに存在しない場合は最初のコースに設定
    useEffect(() => {
        if (filteredCourses.length > 0 && !filteredCourses.some(course => course.id === selectedCourseID)) {
            setSelectedCourseID(filteredCourses[0].id);
        }
    }, [filteredCourses, selectedCourseID]);

    const options = useMemo(() => {
        if (filteredCourses.length === 0) {
            return [
                <option value="" key="no-courses" disabled>
                    検索結果がありません
                </option>
            ];
        }
        return filteredCourses.map((course) => {
            return (
                <option value={course.id} key={`memo-option-${course.id}`}>
                    {course.name}
                </option>
            );
        });
    }, [filteredCourses]);

    if (!props.shown) {
        return <div></div>;
    }

    return (
        <div className='cs-memo-box addMemoBox'>
            <div className='cs-memo-item'>
                <p>{courseName}</p>
                <div className='cs-course-search-container'>
                    <input
                        type='text'
                        className='cs-course-search-input'
                        placeholder='講義名で検索...'
                        value={searchQuery}
                        onChange={(ev) => setSearchQuery(ev.target.value)}
                    />
                </div>
                <label>
                    <select
                        className='todoLecName'
                        value={selectedCourseID}
                        onChange={(ev) => setSelectedCourseID(ev.target.value)}
                    >
                        {options}
                    </select>
                </label>
            </div>
            <div className='cs-memo-item'>
                <p>{memoLabel}</p>
                <label>
                    <input
                        type='text'
                        className='todoContent'
                        value={todoContent}
                        onChange={(ev) => setTodoContent(ev.target.value)}
                    />
                </label>
            </div>
            <div className='cs-memo-item'>
                <p>{dueDate}</p>
                <label>
                    <input
                        type='datetime-local'
                        className='todoDue'
                        value={todoDue}
                        onChange={(ev) => setTodoDue(ev.target.value)}
                    />
                </label>
            </div>
            <div className='cs-memo-item'>
                <button
                    type='submit'
                    id='todo-add'
                    onClick={() => {
                        if (selectedCourseID === "" || todoDue === "") return;

                        let selectedCourse: Course | undefined = undefined;
                        for (const course of props.courses) {
                            if (course.id === selectedCourseID) {
                                selectedCourse = course;
                                break;
                            }
                        }
                        if (selectedCourse === undefined) return;

                        props.onMemoAdd({
                            course: selectedCourse,
                            content: todoContent,
                            due: Date.parse(todoDue) / 1000
                        });
                    }}
                    disabled={selectedCourseID === "" || todoDue === ""}
                >
                    {addBtnLabel}
                </button>
            </div>
        </div>
    );
}

export function MiniSakaiEntryList(props: {
    dueType: DueType;
    entriesWithCourse: {
        entry: EntryUnion;
        course: Course;
    }[];
    settings: Settings;
    isSubset: boolean;
    onCheck: (entry: EntryUnion, checked: boolean, requestDate?: boolean) => void;
    onDelete: (entry: EntryUnion) => void;
}) {
    const className = useMemo(() => {
        const baseClass = "cs-minisakai-list";
        const clazz = `cs-minisakai-list-${props.dueType}`;
        return `${baseClass} ${clazz}`;
    }, [props.dueType]);

    // console.log("course", props.entriesWithCourse)

    // group entries by course
    let courseIdMap = new Map<string, EntryUnion[]>(); // map courseID -> EntryUnions
    const courseNameMap = new Map<string, string>(); // map courseID -> courseName
    for (const ewc of props.entriesWithCourse) {
        let entries: EntryUnion[];
        const courseID = ewc.course.id;
        if (!courseIdMap.has(courseID)) {
            entries = [];
            courseIdMap.set(courseID, entries);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            entries = courseIdMap.get(courseID)!;
        }
        entries.push(ewc.entry);
        courseNameMap.set(courseID, ewc.course.name ?? "unknown course");
    }

    courseIdMap = new Map([...courseIdMap.entries()].sort(sortCourseIdMap(props.settings)));

    const courses: JSX.Element[] = [];
    for (const [courseID, entries] of courseIdMap.entries()) {
        const courseName = courseNameMap.get(courseID) ?? "<unknown>";
        courses.push(
            <MiniSakaiCourse
                key={courseID}
                courseID={courseID}
                courseName={courseName}
                coursePage={"https://" + props.settings.appInfo.hostname + "/portal/site/" + courseID}
                isSubset={props.isSubset}
                dueType={props.dueType}
                entries={entries.sort(sortEntries)}
                onCheck={(entry, checked, requestDate) => props.onCheck(entry, checked, requestDate)}
                onDelete={(entry) => props.onDelete(entry)}
            />
        );
    }

    return <div className={className}>{courses}</div>;
}

const sortCourseIdMap = (settings: Settings) => {
    return function (a: [string, EntryUnion[]], b: [string, EntryUnion[]]): number {
        const showLate = settings.miniSakaiOption.showLateAcceptedEntry;
        const aMin = a[1].reduce((prev, e) => Math.min(e.getDueDate(showLate), prev), MaxTimestamp);
        const bMin = b[1].reduce((prev, e) => Math.min(e.getDueDate(showLate), prev), MaxTimestamp);
        return aMin - bMin;
    };
};

const sortEntries = (a: EntryUnion, b: EntryUnion): number => {
    if (a.dueTime === b.dueTime) {
        if (a.title > b.title) return 1;
        else return -1;
    }
    return a.dueTime - b.dueTime;
};
