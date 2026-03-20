(async () => {
  // Ensure you are logged into the app on localhost before running this!
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return console.error("No user found! Please sign in to the app first.");

  const { error } = await supabase.from('money_accounts').insert([
    { name: 'Main Checking', balance: 5420.50, account_type: 'cash', position: 0, user_id: user.id, custom_icon: 'Wallet' },
    { name: 'Emergency Fund', balance: 12000.00, account_type: 'savings', position: 1, user_id: user.id, custom_icon: 'ShieldCheck' },
    { name: 'Travel Savings', balance: 2150.00, account_type: 'savings', target_balance: 5000.00, position: 2, user_id: user.id, custom_icon: 'Plane' },
    { name: 'Primary Credit Card', balance: 0, statement_balance: 1250.40, due_day: 15, account_type: 'credit', payoff_mode: 'monthly', position: 3, user_id: user.id, custom_icon: 'CreditCard' },
    { name: 'Auto Loan', balance: 0, statement_balance: 18500.00, due_day: 5, account_type: 'loan', payoff_mode: 'fixed', payoff_weeks: 48, user_id: user.id, custom_icon: 'Car' }
  ]);

  if (error) {
    console.error("Seeding failed:", error);
  } else {
    console.log("Success! 5 accounts seeded. Refresh the page to see them.");
  }
})();
