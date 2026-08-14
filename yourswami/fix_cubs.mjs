import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('picks')
      .update({
          pick_value: "-130"
      })
      .eq('id', 'a5882dc3-9dc0-427b-9db3-5ba70995f607');
  
  if (error) {
      console.error("ERROR OCCURRED:", error);
  } else {
      console.log("SUCCESS!", data);
  }
}
run();
