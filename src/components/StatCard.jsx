"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function StatCard({ href, title, value }) {
  const content = (
    <Card className="w-full h-28">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-5xl text-primary font-bold">{value}</CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="w-full h-28 block">
        {content}
      </Link>
    );
  }

  return content;
}

