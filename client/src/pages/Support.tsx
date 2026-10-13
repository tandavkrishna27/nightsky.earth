import React from "react";
import { PolicyPage } from "./Privacy";
import { SUPPORT_EMAIL } from "@shared/nightsky/policies";
export default function Support() { return <PolicyPage kind="support"><p><a className="inline-block rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium" href={`mailto:${SUPPORT_EMAIL}`}>Email {SUPPORT_EMAIL}</a></p></PolicyPage>; }
