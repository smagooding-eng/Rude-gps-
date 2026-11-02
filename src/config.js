// Shared driver reports (police, crashes, hazards...). Supabase project URL and
// its public "publishable"/anon key. The key is meant to be public: the database
// only allows reads of active reports and writes through two checked functions
// (see supabase/reports.sql). Leave empty to disable shared reports.
export const REPORTS = {
  url: '',
  key: '',
};
