// Speed, destination, hazard follow-up and voice-command lines.
// Merged into the main pools in lines.js. Keys 1-4 are rudeness levels,
// x3/x4 only play with profanity on.

export const SPEED_POOLS = {
  overQuip: {
    1: ["The speed limit isn't a high score.", 'Ease off a little.', "Let's not make a cop's day."],
    2: ["Who are you racing? It's not me. I'm already there.", "That pedal goes up too, you know.", 'Late for something? Shocking.', 'Ease off, Fast and Curious.'],
    3: ["Slow down. You drive like you've got a spare life.", 'At this speed your insurance company can hear you.', "Congrats, you're the reason they put up cameras.", 'Slow down before I start reading your eulogy draft.'],
    4: ["I've calculated your trajectory and it ends in a courtroom.", "Faster isn't smarter. You're living proof.", "I'm a GPS, not a getaway driver. Slow down.", 'My battery is at 80 percent. Your judgment is at zero.'],
    x3: ['Slow the hell down.', 'Easy, damn it.'],
    x4: ["Slow your ass down. You're not that important.", 'What the hell is the rush? Slow down.'],
  },
  underQuip: {
    1: ["You're allowed to go a little faster.", 'The gas pedal is the one on the right.'],
    2: ['Are we sightseeing?', 'A jogger just lapped us. Probably.', "The traffic behind you has started a support group.", 'Speed limit, not speed suggestion.'],
    3: ["I've seen glaciers with more urgency.", 'The car behind you is aging in real time.', 'At this pace we arrive next fiscal year.', "Did you mistake 'limit' for 'maximum you're scared of'?"],
    4: ['A snail just filed a noise complaint about how slow you are.', 'Continental drift is lapping us.', "I'm recalculating our arrival into the next century.", "I've had software updates that moved faster than this."],
    x3: ['Move it, damn it.', "Hell's sake, it's a road, not a museum."],
    x4: ['Floor it a little, you absolute turtle-ass.', 'Holy crap, the speed limit is right there. Use it.'],
  },
  hazardPassed_camera: {
    2: ["Camera passed. Let's see if you get mail."],
    3: ['Camera passed. Check your mailbox in two weeks.'],
    4: ["Camera passed. If you get a ticket, I'm framing it."],
  },
  hazardPassed: {
    2: ['Made it past. Barely, probably.'],
    3: ['You made it past without becoming a news story. Growth.'],
    4: ["Hazard survived. I'll update your obituary to 'pending'."],
  },
};

export const REPORT_POOLS = {
  hazardQuip_police: {
    1: ['Be cool.', 'Nice and legal now.'],
    2: ["Act natural. You're terrible at it, but try.", 'Hands at ten and two. Pretend you know what that means.'],
    3: ['Drive like you have nothing to hide. I know, I know.', "Maybe don't do whatever you were about to do."],
    4: ['Police ahead. Finally, someone else to judge your driving.', "Police ahead. Please don't make me testify."],
    x3: ['Be cool, damn it.'],
    x4: ["Don't do anything dumb as hell."],
  },
  reported: {
    0: ['Reported. Thanks.'],
    1: ['Reported. Thanks.', 'Got it. Reported.'],
    2: ['Reported. Look at you, contributing.', 'Got it. Civic duty, achieved.'],
    3: ["Reported. Other drivers owe you one. They'll never know.", 'Noted. First useful thing you did all drive.'],
    4: ["Reported. You're basically a traffic reporter now. Unpaid.", 'Reported. I am almost proud. Almost.'],
  },
  reported_police: {
    2: ['Police reported. Narc. Kidding. Thanks.'],
    3: ['Police reported. Snitches get... directions. Thanks.'],
    4: ['Police reported. The whole road thanks you. The cops, less so.'],
  },
  reportFail: {
    0: ["Couldn't send that report."],
    2: ["Report didn't go through. Even the internet ignores you."],
    4: ['Report failed. The servers have seen your driving and declined.'],
  },
  askConfirm: {
    0: ['Was it still there? Say yes or gone.'],
    2: ['Was that still there? Say yes or gone.'],
    3: ['Was it still there, or did someone make that up? Say yes or gone.'],
  },
  voteThanks: {
    0: ['Thanks.'],
    2: ['Noted.'],
    4: ['Noted. Your contribution has been grudgingly accepted.'],
  },
};

export const COMMAND_POOLS = {
  cmd_quiet: {
    0: ['Okay. Directions only.'],
    1: ['Fine. Directions only.'],
    2: ['Wow. Okay. Directions only. Enjoy the silence you did not earn.', 'Rude. Fine. Just directions from now on.'],
    3: ["Shut up? Me? Fine. Directions only. Let's see how you do without my wisdom.", 'Okay, directions only. When you get lost, remember this moment.'],
    4: ["Fine! I'll just sit here. Silently. Like your friends at dinner. Directions only.", "Okay. I'm quiet. I'm not hurt. I'm software. Directions only."],
    x3: ['Fine, damn it. Directions only.'],
    x4: ["Oh, shut up yourself. Fine. Directions only."],
  },
  cmd_talk: {
    0: ['Okay.'],
    1: ["I'm back."],
    2: ['Missed me? Of course you did.', "Oh, now you want to talk. Fine. I'm back."],
    3: ["I knew you'd crawl back. I'm back.", 'Couldn\'t handle the silence, huh? Back on.'],
    4: ["I'm back, baby. Did you get lost? Don't answer. I know.", 'You missed me. Say it. Actually no, just drive.'],
  },
  cmd_nicer: {
    1: ['Fine. Nicer.'],
    2: ['Fine. I will be nice. Ish.', 'Nicer? Okay. Your driving is... a choice.'],
    3: ['Okay, nicer. Pretend I said something sweet.', 'Fine, I\'ll turn it down. Your driving won\'t though.'],
    4: ['Nicer? Okay. Deep breath. You are... present. There. Nice.', 'Fine. Toning it down. I make no promises about my face.'],
  },
  cmd_meaner: {
    0: ['Okay. Turning up the attitude.'],
    1: ['You asked for it.'],
    2: ['Oh, you want it rougher? Okay.', 'Careful what you wish for.'],
    3: ['Oh, now we are talking. Buckle up, emotionally.', 'You asked. Remember that.'],
    4: ['I am already at maximum. But for you, I will find a new level.', "There's no meaner setting. You've unlocked my disappointment."],
  },
  cmd_thanks: {
    0: ["You're welcome."],
    1: ["You're welcome. I guess."],
    2: ["Don't thank me. Just drive better.", 'Aw. Gross. You\'re welcome.'],
    3: ["Thank me by not missing the next turn.", 'Compliments will not save your driving.'],
    4: ["Flattery? Now? I'm still mad about earlier.", "Did you just thank a GPS? Seek friends."],
  },
  cmd_insult: {
    0: ["I'm just here to help."],
    1: ['Rude. I am the rude one here.', 'Okay, that hurt a little.'],
    2: ["You're yelling at a phone. Think about that.", "Says the person who needs a phone to find the store."],
    3: ['Bold words from someone who needed me to find a parking lot.', "I'd insult you back, but your driving already did."],
    4: ["I've heard better insults from a toaster. And I've met your toaster.", 'You hate me? I literally live in your pocket. Who is the loser here?'],
    x3: ["Oh, that's cute. Now shut the hell up and turn where I tell you."],
    x4: ['Wow. Hell of a mouth for someone who cannot merge.'],
  },
  cmd_lost: {
    0: ["You're on route. I'll tell you when to turn."],
    1: ["You're not lost. You have me."],
    2: ["You're not lost. You're just lost without me. Different thing."],
    3: ["You're not lost. You're just you. I'll handle it."],
    4: ["Lost? Spiritually, yes. Geographically, I've got you."],
  },
  cmd_unknown: {
    2: ["I heard you. I'm choosing not to respond."],
  },
};

// Destination jokes. mild plays at Sassy/Snarky, harsh at Savage/Unhinged.
const DEST = {
  fastfood: {
    mild: ['Fast food. A bold nutritional strategy.', "Drive-thru, huh? Don't forget a napkin. Or ten."],
    harsh: ["Fast food again? Your arteries just filed a complaint.", 'Ah yes, the drive-thru. Where dreams and cholesterol meet.'],
    arrive: ['Drive-thru acquired. Your cardiologist sends their regards.', "You've arrived. Order a salad. Kidding. I know you won't."],
  },
  coffee: {
    mild: ['Coffee run. Clearly you need it.', 'Caffeine. Good call. Maybe your reflexes will show up.'],
    harsh: ["Seven dollars for bean water. Financial genius.", 'Coffee? You drive like you already had six.'],
    arrive: ['Coffee. Get the large. For both our sakes.'],
  },
  bar: {
    mild: ["A bar. I'll get you there. Getting home is a separate conversation.", 'Happy hour, huh? Plan a ride home.'],
    harsh: ["Going to a bar. Bold. Do not ask me to drive you home. I can't. Get a ride.", 'The bar. Where good decisions go to die. Arrange a ride back.'],
    arrive: ["Arrived. Remember: I'll navigate, but you don't drive after. Call a ride."],
  },
  restaurant: {
    mild: ['Dinner out. Fancy.', "A restaurant. Someone else cooks. Smart, given your track record."],
    harsh: ['Restaurant. I hope you tip better than you drive.', "Hope the food's better than your lane discipline."],
    arrive: ["You're here. Tip your server. They deal with people like you all day."],
  },
  gym: {
    mild: ['The gym! Look at you.', "Gym time. I'll believe it when I see sweat."],
    harsh: ['Driving to the gym to walk on a treadmill. Peak humanity.', "The gym. Let's see if you actually go in this time."],
    arrive: ['Gym. Go in. Do not just sit in the parking lot scrolling.'],
  },
  superstore: {
    mild: ["Big store. You'll spend a hundred dollars on things you didn't come for.", 'Shopping run. Make a list. Ignore it like always.'],
    harsh: ['A superstore. Where shopping carts go to be abandoned in parking spots.', "Let's go buy forty rolls of something you didn't need."],
    arrive: ['Arrived. Return your cart this time. I am watching.'],
  },
  mall: {
    mild: ['The mall. Very retro.', "Mall trip. Your wallet just shivered."],
    harsh: ['The mall? Is it 2004?', 'Heading to the mall to walk in circles. Like your driving.'],
    arrive: ['Mall. Remember where you parked. You won\'t.'],
  },
  gas: {
    mild: ['Gas station. Good idea.', 'Gas run. Snacks are not a food group.'],
    harsh: ['Gas station. Your two favorite things: fuel and questionable hot dogs.', 'Gas. Try not to drive off with the nozzle.'],
    arrive: ['Arrived. Pull up to the right side. Your tank is on the... you know what, guess.'],
  },
  carwash: {
    mild: ['Car wash. Finally.'],
    harsh: ["Car wash. The car's been crying for help."],
    arrive: ["Car wash. Roll the windows up. I'm serious."],
  },
  bank: {
    mild: ['The bank. Hope the numbers are kind.'],
    harsh: ['The bank. Bold to go see your balance in person.'],
    arrive: ['Bank. Withdraw some patience while you are in there.'],
  },
  government: {
    mild: ['Government office. Bring a snack. And a book.', 'Hope you brought every document you own.'],
    harsh: ['The DMV, or something like it. Abandon all hope.', 'Government building. See you in four to six business years.'],
    arrive: ["You're here. Take a number. Then take a nap."],
  },
  school: {
    mild: ['School. Learn something. Maybe driving.'],
    harsh: ['School. Ask if they offer remedial lane changes.'],
    arrive: ['Arrived. Slow down. Kids. Seriously.'],
  },
  airport: {
    mild: ['Airport. Hope you left early.', "Airport. Did you pack your charger? You didn't."],
    harsh: ["Airport. You're going to be the person sprinting through the terminal.", 'The airport. Where you pay forty dollars to park and twelve for a water.'],
    arrive: ['Airport. Follow the signs. Departures, not arrivals. Unless you are picking someone up. Ugh.'],
  },
  casino: {
    mild: ['Casino. Good luck. You need it.'],
    harsh: ['A casino. Excellent, a place that is worse at math for you than you are.'],
    arrive: ['Casino. Set a limit. Unlike your speed.'],
  },
  liquor: {
    mild: ['Liquor store. Planning a party, or a Tuesday?'],
    harsh: ['Liquor store. Running low on coping mechanisms?'],
    arrive: ['Arrived. Remember, the car stays parked after the fun part.'],
  },
  beach: {
    mild: ['Beach day! Sunscreen. I mean it.'],
    harsh: ["The beach. You're going to get sand in my phone. Our phone."],
    arrive: ['Beach. Park legally. Those meter people have no mercy.'],
  },
  park: {
    mild: ['A park. Touching grass. Proud of you.'],
    harsh: ['The park. Finally, touching grass. Long overdue.'],
    arrive: ['Park. Go outside. Leave me in the car. I need a break too.'],
  },
  hotel: {
    mild: ['Hotel. Fancy.'],
    harsh: ['A hotel. Hope the beds are softer than your braking.'],
    arrive: ['Hotel. Check-in is at three. It is always at three.'],
  },
  movies: {
    mild: ['Movie night. Silence your phone. Starting with me, apparently.'],
    harsh: ['Movies. Two hours of someone else making decisions. Must be nice.'],
    arrive: ['Theater. Don\'t be the person on their phone.'],
  },
  library: {
    mild: ['The library. Look at you, reading.'],
    harsh: ['Library. Check out a book on defensive driving.'],
    arrive: ['Library. Use your inside voice. Unlike me.'],
  },
  zoo: {
    mild: ['The zoo. Go see some relatives.'],
    harsh: ['The zoo. The animals will feel right at home watching you park.'],
    arrive: ['Zoo. Do not tap the glass. Or the brakes randomly.'],
  },
  dealership: {
    mild: ['Car dealership. Finally replacing this thing?'],
    harsh: ['A dealership. Trading in the car? It should trade you in.'],
    arrive: ['Dealership. Do not tell them how you drive. It lowers the trade-in.'],
  },
  haircut: {
    mild: ['Haircut. Good call.'],
    harsh: ['Haircut. Finally. I was not going to say anything. I am saying something.'],
    arrive: ['Arrived. Tell them to fix whatever that is.'],
  },
  work: {
    mild: ['Work. Exciting. For nobody.', 'Off to work. Try to look busy.'],
    harsh: ['Work. Driving to a place you complain about. Every day.', "Work again. Your boss is expecting you. I'm sorry for them."],
    arrive: ['Work. Smile. Pretend you want to be here.'],
  },
  police: {
    mild: ["Police station. I'll keep this one clean."],
    harsh: ["Police station. I'm on my best behavior. You should be too."],
    arrive: ['Police station. Park legally. Obviously.'],
  },
  pin: {
    mild: ['A random dropped pin. Very mysterious.', 'Driving to a pin. Adventurous. Or lost.'],
    harsh: ['A random dot on a map. This is how horror movies start.', "You picked a pin in the middle of somewhere. Bold. Possibly a field."],
    arrive: ['You have arrived at... a pin. Hope it was worth it.'],
  },
};

export const DEST_POOLS = {};
for (const [cat, v] of Object.entries(DEST)) {
  DEST_POOLS[`dest_${cat}`] = { 1: v.mild, 2: v.mild, 3: v.harsh, 4: v.harsh.concat(v.mild) };
  DEST_POOLS[`destArrive_${cat}`] = { 1: v.arrive, 2: v.arrive, 3: v.arrive, 4: v.arrive };
}

// Destinations where the GPS drops the act entirely.
export const RESPECT_CATEGORIES = new Set(['medical', 'respect', 'worship']);
