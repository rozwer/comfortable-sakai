/**
 * 提出済み課題エントリー表示コンポーネント
 * 提出済みの課題を専用UIで表示する機能
 */
/**
 * 提出済み課題エントリー表示コンポーネント
 * 提出済みの課題を専用UIで表示
 */
/**
 * -----------------------------------------------------------------
 * Created by: roz
 * Date       : 2025-05-20
 * Changes    : 提出済み課題のエントリ表示用コンポーネント
 * Category   : UI追加
 * -----------------------------------------------------------------
 */
import { AssignmentEntry } from "../features/entity/assignment/types";
import React, { useId, useEffect } from "react";
import { createDateString, getRemainTimeString } from "../utils";
import { CurrentTime } from "../constant";
import { useTranslation } from "./helper";
import { EntryUnion } from "./entryTab";

// スタイル修正関数をコンポーネントファイルごとに定義
function fixSubmittedListStyles() {
    setTimeout(() => {
        try {
            // コース名（白色テキスト）のスタイル修正
            document.querySelectorAll('.cs-course-submitted').forEach((elem) => {
                (elem as HTMLElement).style.color = "#f7f7f7";
                (elem as HTMLElement).style.opacity = "1";
                (elem as HTMLElement).style.background = "#62b665";
            });

            // 課題タイトルと日付のスタイル修正
            document.querySelectorAll('.cs-minisakai-list-submitted .cs-assignment-title, .cs-minisakai-list-submitted p, .cs-minisakai-list-submitted span').forEach((elem) => {
                (elem as HTMLElement).style.color = "#464646";
                (elem as HTMLElement).style.opacity = "1";
            });
        } catch (e) {
            console.error("スタイル修正中にエラーが発生しました", e);
        }
    }, 100);
}

export default function SubmittedEntryView(props: {
    entry: EntryUnion;
    isSubset: boolean;
    onToggleMemoBox?: (entry: EntryUnion) => void;
}) {
    // コンポーネントがマウントされた際にスタイル修正を実行
    useEffect(() => {
        fixSubmittedListStyles();
    }, []);
    const entry = props.entry;
    const dueTime = entry instanceof AssignmentEntry && entry.isDuePassed(CurrentTime) 
        ? entry.closeTime 
        : entry.dueTime;
    
    const dueDateString = createDateString(dueTime);
    const remainTimeString = getRemainTimeString(dueTime);

    const lateBadge = useTranslation("late");
    const dummyId = useId();
    
    const isAssignment = entry instanceof AssignmentEntry;
    const hasUnlimitedResubmit = isAssignment && entry.allowResubmitNumber === "-1";
    const isResubmitDisabled = isAssignment && entry.allowResubmitNumber === "0";
    const hasLimitedResubmit = isAssignment && 
                               entry.allowResubmitNumber && 
                               entry.allowResubmitNumber !== "-1" && 
                               entry.allowResubmitNumber !== "0" &&
                               !isNaN(parseInt(entry.allowResubmitNumber)) &&
                               parseInt(entry.allowResubmitNumber) > 0;

    return (
        <>
            {!props.isSubset ? (
                <>
                    <div 
                        className="cs-dummy-btn" 
                        id={dummyId} 
                        onClick={() => props.onToggleMemoBox && props.onToggleMemoBox(props.entry)}
                        style={{ opacity: 1 }}
                    >+</div>
                    <p className="cs-assignment-date" style={{ color: "#464646", opacity: 1 }}>{dueDateString}</p>
                </>
            ) : (
                <span className="cs-assignment-date cs-assignmate-date-padding" style={{ color: "#464646", opacity: 1 }}>{dueDateString}</span>
            )}
            <span className="cs-assignment-time-remain" style={{ color: "#464646", opacity: 1 }}>{remainTimeString}</span>

            <p className="cs-assignment-title" style={{ color: "#464646", opacity: 1 }}>
                {isAssignment && (entry as AssignmentEntry).isDuePassed(CurrentTime) && (
                    <span className="cs-badge cs-badge-late" style={{ opacity: 1, position: "relative", zIndex: 2 }}>{lateBadge}</span>
                )}
                <span style={{ color: "#464646", opacity: 1 }}>{entry.title}</span>
            </p>
            <div className="cs-assignment-badges" style={{ color: "#464646", opacity: 1 }}>
                {hasUnlimitedResubmit && (
                    <span className="cs-badge cs-badge-resubmit" style={{ opacity: 1, position: "relative", zIndex: 2 }}>
                        再提出可能: 無制限
                    </span>
                )}
                {isResubmitDisabled && (
                    <span className="cs-badge cs-badge-resubmit-disabled" style={{ opacity: 1, position: "relative", zIndex: 2 }}>
                        再提出不可
                    </span>
                )}
                {hasLimitedResubmit && (
                    <span className="cs-badge cs-badge-resubmit" style={{ opacity: 1, position: "relative", zIndex: 2 }}>
                        再提出可能: {(entry as AssignmentEntry).allowResubmitNumber}回
                    </span>
                )}
            </div>
        </>
    );
}