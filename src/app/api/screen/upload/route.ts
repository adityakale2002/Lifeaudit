import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

// POST /api/screen/upload
// Accepts CSV data and parses it into screen_entries
export async function POST(req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 });
  }

  // Parse CSV (assuming format: Date,App Name,Category,Hours)
  // Skip header row
  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 4) continue;
    
    const [date, app_name, category, hoursStr] = parts;
    const hours = parseFloat(hoursStr);
    
    if (!date || !app_name || !category || isNaN(hours) || hours <= 0) continue;
    
    entries.push({
      user_id: user.id,
      app_name,
      category: categorizeApp(category, app_name),
      hours,
      entry_date: date,
      source: "import",
    });
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid entries found in CSV" }, { status: 400 });
  }

  // Insert all entries
  const { error } = await supabase
    .from("screen_entries")
    .insert(entries as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    imported: entries.length,
    message: `Successfully imported ${entries.length} screen time entries`
  });
}

// Helper function to categorize apps
function categorizeApp(rawCategory: string, appName: string): string {
  const cat = rawCategory.toLowerCase();
  const app = appName.toLowerCase();
  
  // Social media
  if (/(social|facebook|instagram|twitter|tiktok|snapchat|whatsapp|telegram)/i.test(cat + app)) {
    return "Social";
  }
  
  // Productivity
  if (/(productivity|work|office|notion|slack|teams|zoom|email|calendar)/i.test(cat + app)) {
    return "Productivity";
  }
  
  // Entertainment
  if (/(entertainment|video|youtube|netflix|disney|hulu|spotify|music|game)/i.test(cat + app)) {
    return "Entertainment";
  }
  
  // News & Reading
  if (/(news|reading|safari|chrome|browser|article|medium)/i.test(cat + app)) {
    return "News & Reading";
  }
  
  // Learning
  if (/(education|learning|course|duolingo|khan|udemy|coursera|book)/i.test(cat + app)) {
    return "Learning";
  }
  
  // Health & Fitness
  if (/(health|fitness|workout|meditation|calm|headspace)/i.test(cat + app)) {
    return "Health";
  }
  
  // Default
  return "Other";
}
