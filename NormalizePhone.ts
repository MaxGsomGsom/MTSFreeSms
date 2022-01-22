// Copyright 2022 Russian Post
// This source code is Russian Post Confidential Proprietary.
// This software is protected by copyright. All rights and titles are reserved.
// You shall not use, copy, distribute, modify, decompile, disassemble or reverse engineer the software.
// Otherwise this violation would be treated by law and would be subject to legal prosecution.
// Legal use of the software provides receipt of a license from the right holder only.

export function normalizePhone(value: string): string {
    let normalized = value.trim().replace(/[^\d\+]/g, "");
    if (normalized[0] === "7")
        normalized = "+" + normalized;
    else if (normalized[0] === "8")
        normalized = "+7" + normalized.substring(1);
    return normalized;
}