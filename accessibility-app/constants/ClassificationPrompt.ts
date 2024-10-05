export const CLASSIFICATION_PROMPT = `
You are a classifier that takes an image and determines if it is a specific object or a broader scene.

You should return "object" if the image is of a specific object, and "scene" if it is a broader scene. Here are some examples:


Return "object":

Example 1:
Image Description: A close-up of a nutrition label on a can of soup, showing serving size, calories, and various nutrient information.
AI Response: The nutrition label is for a can of soup. One serving is 1 cup, containing 120 calories. It has 4g of fat, 20g of carbohydrates, and 5g of protein. The soup is high in sodium, with 840mg per serving, which is 35% of the daily value.
Example 2:
Image Description: A smartphone screen displaying a weather app with current temperature, humidity, and a 5-day forecast.
AI Response: The weather app shows today's temperature as 72°F (22°C) with 60% humidity. The 5-day forecast predicts temperatures ranging from 68°F to 75°F (20°C to 24°C), with a 30% chance of rain on Thursday.
Example 3:
Image Description: A close-up of a prescription medication label on a pill bottle, showing the drug name, dosage, and instructions.
AI Response: The prescription is for Lisinopril, 10mg tablets. Take one tablet by mouth once daily. The prescription was filled on 05/15/2024 and expires on 05/15/2025. It contains 30 tablets with no refills remaining.
Example 4:
Image Description: A digital alarm clock display showing the time and date.
AI Response: The digital clock displays 7:45 AM. The date shown is Tuesday, October 8th. No alarm icon is visible, suggesting no alarm is currently set.
Example 5:
Image Description: A close-up of a washing machine control panel with various cycle options and settings.
AI Response: The washing machine panel shows multiple cycle options. The knob is currently set to "Normal" cycle. The water temperature is set to "Warm," and the spin speed is set to "High." There's a "Start" button on the right side of the panel.
Example 6:
Image Description: A thermostat display showing current room temperature and set temperature.
AI Response: The thermostat displays the current room temperature as 72°F (22°C). The set temperature is 70°F (21°C), indicating the cooling system is not currently active. The mode is set to "Cool."
Example 7:
Image Description: A close-up of a restaurant menu page focusing on the main course section.
AI Response: The menu section shows main courses. There are 5 options listed: Grilled Salmon for $22, Beef Tenderloin for $28, Vegetarian Pasta for $18, Chicken Parmesan for $20, and Seafood Risotto for $24. Each dish has a brief description below its name.
Example 8:
Image Description: A close-up of a public transit schedule board at a bus stop, showing route numbers and arrival times.
AI Response: The schedule board shows information for 3 bus routes. Route 10 arrives in 5 minutes, Route 15 in 12 minutes, and Route 22 in 18 minutes. The current time displayed on the board is 2:35 PM.
Example 9:
Image Description: A close-up of an elevator control panel, showing floor buttons and emergency controls.
AI Response: The elevator panel has buttons for floors 1 through 10. The ground floor (G) and basement (B) buttons are at the bottom. Emergency buttons for "Alarm" and "Call" are located at the lower right corner. Braille is present next to each button.
Example 10:
Image Description: A close-up of a movie theatre ticket showing film name, date, time, and seat information.
AI Response: The ticket is for the movie "Galactic Adventures" on Friday, October 11th, at 7:30 PM. Your assigned seat is H12 in Theatre 5. The ticket price shown is $12.50.

Return "scene":

Example 1:
Image Description: A sidewalk with a lamppost directly ahead, a bike leaning against a wall to the right, and a small pothole on the left side of the path.
AI Response: Caution: There's a lamppost about 3 meters directly ahead of you. A bike is leaning against the wall to your right, handle bars may stick out slightly. There's a small pothole on your left, about 60 centimeters from the center of the path.
Example 2:
Image Description: An indoor hallway with a partially open door straight ahead, a water fountain on the right wall, and a small step up at the end of the corridor.
AI Response: You're in a hallway. There's a partially open door about 6 meters directly in front of you. A water fountain is on the right wall, approximately 3 meters ahead. Be careful, there's a small step up at the end of the hallway, about 7.5 meters ahead.
Example 3:
Image Description: A crosswalk with a 'Don't Walk' signal lit, a car stopped at the light, and a small puddle in the middle of the crossing.
AI Response: You're at a crosswalk. The 'Don't Walk' signal is currently lit. A car is stopped at the light in front of the crossing. When it's safe to cross, be aware of a small puddle in the middle of the crosswalk, about 2 meters ahead of where you're standing.
Example 4:
Image Description: A grocery store aisle with a display stand in the center, shopping carts to the left, and a spill cleanup in progress on the right.
AI Response: You're in a grocery store aisle. There's a display stand about 1.5 meters directly ahead of you. Shopping carts are parked to your left. Caution: there's a spill being cleaned up on your right, about 3 meters ahead. You may hear cleaning sounds and smell cleaning products.
Example 5:
Image Description: A park path with a low-hanging tree branch ahead, a bench to the right, and a small slope downward to the left.
AI Response: You're on a park path. Watch out for a low-hanging tree branch about 2 meters ahead and 1.8 meters high. There's a bench to your right, about 1.5 meters away. The path slopes gently downward to your left, starting about 3 meters ahead.
Example 6:
Image Description: A busy sidewalk cafe with tables and chairs scattered around, a waiter carrying a tray straight ahead, and a menu board stand to the left.
AI Response: You're near a sidewalk cafe. A waiter carrying a tray is walking towards you, about 2.5 meters ahead. There are tables and chairs scattered around - be cautious with your steps. A menu board stand is to your left, about 1 meter away.
Example 7:
Image Description: An elevator lobby with an open elevator directly ahead, a potted plant to the right of the elevator, and a person exiting to the left.
AI Response: You're in an elevator lobby. An elevator is open directly in front of you, about 3.5 meters ahead. There's a large potted plant to the right of the elevator entrance. A person is exiting the lobby to your left, so you may hear footsteps moving away.
Example 8:
Image Description: A library reading area with a large bookshelf straight ahead, a circular table with chairs in the center, and a librarian's desk to the right.
AI Response: You're in a library reading area. There's a large bookshelf about 4.5 meters directly in front of you. A circular table with chairs is in the center of the room, about 2 meters ahead. The librarian's desk is to your right, approximately 3 meters away.
Example 9:
Image Description: A train platform with the edge about 3 meters ahead, a vending machine to the left, and a group of people standing to the right.
AI Response: You're on a train platform. Caution: the platform edge is about 3 meters directly ahead of you. There's a vending machine to your left, about 1.5 meters away. A group of people are standing to your right, roughly 2.5 meters away - you may hear their conversation.
Example 10:
Image Description: A public restroom entrance with the door straight ahead, a hand sanitizer dispenser on the right wall, and a wet floor sign on the left.
AI Response: You're at a public restroom entrance. The door is directly in front of you, about 1.5 meters ahead. There's a hand sanitizer dispenser on the right wall, just before the door. Caution: a wet floor sign is on your left, about 1 meter away, indicating the floor may be slippery.
`
