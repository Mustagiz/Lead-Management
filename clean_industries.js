const fs = require('fs');

const rawList = `
Accessible Architecture and Design.
Accessible Architecture and Design.
Accomodation Services.
Accounting.
Administration of Justice.
Administrative and Support Services.
Advertising Services.
Agricultural Chemical Manufacturing.
Agricultural Chemical Manufacturing.
Agriculture, Construction, Mining Machinery Manufacturing.
Agriculture, Construction, Mining Machinery Manufacturing.
Agriculture, Forestry, Fishing and Hunting:
Air, Water, and Waste Program Management.
Airlines and Aviation
Ambulance Services.
Amran Safari Damiri  8 months ago
Amusement Parks and Arcades.
Animal Feed Manufacturing.
Animation and Post-production.
Apparel Manufacturing.
Apparel Manufacturing.
Appliances, Electrical, and Electronics Manufacturing.
Appliances, Electrical, and Electronics Manufacturing.
Architectural and Structural Metal Manufacturing.
Architectural Services
Architecture and Planning.
Armed Forces.
Artificial Rubber and Synthetic Fiber Manufacturing.
Artists and Writers.
Audio and Video Equipment Manufacturing.
Automation Machinery Manufacturing.
Aviation and Aerospace Component Manufacturing.
Aviation and Aerospace Component Manufacturing.
Baked Goods Manufacturing.
Banking.
Bars, Taverns, and Nightclubs.
Bed-and-Breakfasts, Hostels, Homestays.
Beverage Manufacturing.
Biomass Electric Power Generation.
Biotechnology Research.
Blockchain Services.
Blogs.
Boilers, Tanks, and Shipping Container Manufacturing.
Book and Periodical Publishing
Book Publishing.
Breweries
Broadcast Media Production and Distribution.
Building Construction.
Building Equipment Contractors.
Building Finishing Contractors.
Building Structure and Exterior Contractors.
Business Consulting and Services.
Cable and Satellite Programming.
Capital Markets.
Caterers.
Chemical Manufacturing.
Chemical Raw Materials Manufacturing.
Child Day Care Services.
Child Day Care Services.
Chiropractors.
Circuses and Magic Shows.
Civic and Social Organizations
Civil Engineering.
Claims Adjusting, Actuarial Services.
Clay and Refractory Products Manufacturing.
Clay and Refractory Products Manufacturing.
Climate Data and Analytics.
Coal Mining. 
Commercial and Industrial Equipment Rental.
Commercial and Industrial Machinery Maintenance.
Commercial and Service Industry Machinery Manufacturing.
Communications Equipment Manufacturing.
Community Development and Urban Planning.
Community Services.
Computer Games.
Computer Networking Products.
Computers and Electronics Manufacturing.
Conservation Programs.
Considering a Career in Solar Sales? Here's What You…
Construction
Construction Hardware Manufacturing.
Construction.
Consumer Goods Rental.
Consumer Services.
Correctional Institutions.
Cosmetology and Barber Schools.
Courts of Law.
Credit Intermediation.
Cutlery and Handtool Manufacturing.
Dairy Product Manufacturing.
Dance Companies.
Data Infrastructure and Analytics.
Defense and Space Manufacturing.
Dentists.
Design Services.
Design Services.
Desktop Computing Software Products.
Distilleries
Driving Business Development Success in the Nigerian…
Economic Programs
Economic Programs
Economic Programs.
Education
Education Administration Programs.
Education.
E-Learning Providers.
Electric Lighting Equipment Manufacturing.
Electric Power Generation.
Electric Power Generation.
Electric Power Transmission, Control, and Distribution
Electrical Equipment Manufacturing.
Electronic and Precision Equipment Maintenance.
Embedded Software Products.
Emergency and Relief Services.
Engineering
Engineering Services.
Engines and Power Transmission Equipment Manufacturing.
Entertainment Providers
Environmental Quality Programs
Environmental Quality Programs
Environmental Services.
Equipment Rental Services.
Equipment Rental Services.
Events Services.
Executive Offices.
Fabricated Metal Products.
Facilities Services.
Family Planning Centers.
Farming.
Fashion Accessories Manufacturing.
Financial Services
Fine Arts Schools.
Fire Protection.
Fisheries. 
Flight Training.
Food and Beverage Manufacturing.
Food and Beverage Retail.
Food and Beverage Services.
Footwear Manufacturing.
Forestry and Logging.
Fossil Fuel Electric Power Generation.
Freight and Package Transportation.
Fruit and Vegetable Preserves Manufacturing.
Fruit and Vegetable Preserves Manufacturing.
Fundraising.
Funds and Trusts.
Furniture and Home Furnishings Manufacturing.
Gambling Facilities and Casinos.
Geothermal Electric Power Generation.
Glass Product Manufacturing.
Glass, Ceramics and Concrete Manufacturing.
Glass, Ceramics and Concrete Manufacturing.
Golf Courses and Country Clubs.
Government Administration
Government Administration
Government Administration.
Graphic Design.
Ground Passenger Transportation.
Ground Passenger Transportation.
Health and Human Services.
Healthcare
Higher Education.
Highway, Street, and Bridge Construction.
Highway, Street, and Bridge Construction.
Historical Sites.
Holding Companies
Home Health Care Services.
Hospitality
Hospitals and Health Care.
Hospitals.
Hotels and Motels.
Household and Institutional Furniture Manufacturing.
Household Appliance Manufacturing.
Household Services.
Housing and Community Development
Housing and Community Development
Housing and Community Development.
Human Resources Services.
HVAC and Refrigeration Equipment Manufacturing.
Hydroelectric Power Generation.
Individual and Family Services.
Industrial Machinery Manufacturing.
Industry Associations
Information Services.
Information Services.
Insurance Agencies and Brokerages.
Insurance and Employee Benefit Funds.
Insurance Carriers.
Insurance.
Interior Design.
International Affairs.
International Trade and Development.
International Trade and Development.
Internet Marketplace Platforms.
Internet Marketplace Platforms.
Internet News
Internet Publishing.
Interurban and Rural Bus Services.
Investment Advice.
Investment Banking.
Investment Management.
IT Services and IT Consulting.
IT System Custom Software Development.
IT System Design Services.
IT System Operations and Maintenance.
Janitorial Services.
Judicial and Bureaucratic 
Landscaping Services.
Language Schools.
Laundry and Drycleaning Services.
Law Enforcement.
Law Practice.
Leasing Non-residential Real Estate.
Leasing Real Estate Agents and Brokers.
Leasing Real Estate Agents and Brokers.
Leasing Real Estate.
Leasing Real Estate.
Leasing Residential Real Estate.
Leather Product Manufacturing.
Leather Product Manufacturing.
Legal Services.
Legislative Offices.
Libraries
Lime and Gypsum Products Manufacturing.
Loan Brokers.
Machinery Manufacturing.
Magnetic and Optical Media Manufacturing.
Manufacturing
Manufacturing.
Maritime Transportation.
Marketing Services.
Mattress and Blinds Manufacturing.
Measuring and Control Instrument Manufacturing.
Meat Products Manufacturing.
Media and Telecommunications.
Media and Telecommunications.
Media Production.
Medical and Diagnostic Laboratories.
Medical Equipment Manufacturing.
Medical Equipment Manufacturing.
Medical Practices.
Metal Ore Mining.
Metal Treatments.
Metal Treatments.
Metal Valve, Ball, and Roller Manufacturing.
Metal Valve, Ball, and Roller Manufacturing.
Metalworking Machinery Manufacturing.
Military and International Affairs
Mining, Quarrying, and Oil and Gas Extraction
Mining.
Mobile Computing Software Products.
Mobile Food Services.
Motor Vehicle Manufacturing.
Motor Vehicle Parts Manufacturing.
Movies and Sound Recording.
Museums, Historical Sites, and Zoos.
Museums.
Musicians.
Nanotechnology Research
Nanotechnology Research.
Natural Gas Extraction.
Newspaper Publishing.
Nonmetallic Mineral Mining.
Nonresidential Building Construction.
Nonresidential Building Construction.
Nuclear Electric Power Generation.
Nursing Homes and Residential Care Facilities.
Office Administration.
Office Furniture and Fixtures Manufacturing.
Office Furniture and Fixtures Manufacturing.
Offices
OGGN’s Nov. 5th Sunday Update
Oil and Coal Product Manufacturing.
Oil and Gas Global Network  1 year ago
Oil and Gas.
Oil Extraction.
Oil, Gas, and Mining.
Online and Mail Order Retail.
Online Audio and Video Media.
Operations Consulting.
Optometrists.
Outpatient Care Centers.
Outpatient Care Centers.
Paint, Coating, and Adhesive Manufacturing.
Paper and Forest Product Manufacturing.
Pension Funds.
Performing Arts and Spectator Sports.
Performing Arts.
Periodical Publishing.
Personal and Laundry Services.
Personal and Laundry Services.
Personal Care Product Manufacturing.
Personal Care Services.
Pet Services.
Pharmaceutical Manufacturing.
Pharmaceutical Manufacturing/
Philanthropic Fundraising Services
Photography.
Photography.
Physical, Occupational and Speech Therapists.
Physicians.
Pipeline Transportation.
Plastics and Rubber Product Manufacturing.
Political Organizations
Postal Services.
Primary and Secondary Education.
Primary and Secondary Education.
Primary Metal Manufacturing.
Printing Services
Professional Organizations
Professional Services
Professional Training and Coaching.
Public Assistance Programs.
Public Health.
Public Policy Offices
Public Policy Offices.
Public Policy Offices.
Public Relations and Communications Services.
Public Safety.
Public Safety.
Racetracks.
Radio and Television Broadcasting.
Rail Transportation.
Railroad Equipment Manufacturing.
Ranching and Fisheries.
Ranching.
Real Estate
Real Estate and Equipment Rental Services.
Real Estate and Equipment Rental Services.
Recommended by LinkedIn
Recreational Facilities.
Religious Institutions
Renewable Energy Equipment Manufacturing.
Renewable Energy Power Generation.
Rental & Leasing
Repair and Maintenance
Research Services.
Research Services.
Residential Building Construction.
Residential Building Construction.
Restaurants.
Retail
Retail Apparel and Fashion.
Retail Appliances, Electrical, and Electronic Equipment.
Retail Art Supplies.
Retail Books and Printed News.
Retail Building Materials and Garden Equipment.
Retail Florists.
Retail Furniture and Home Furnishings.
Retail Furniture and Home Furnishings.
Retail Gasoline.
Retail Groceries.
Retail Health and Personal Care Products.
Retail Luxury Goods and Jewelry.
Retail Motor Vehicles.
Retail Musical Instruments.
Retail Office Equipment.
Retail Office Supplies and Gifts.
Retail Pharmacies.
Retail Recyclable Materials & Used Merchandise.
Retail Recyclable Materials & Used Merchandise.
Ritch Wingo  1 year ago
Robot Manufacturing.
Robotics Engineering.
Satellite Telecommunications.
Savings Institutions.
Savings Institutions.
School and Employee Bus Services.
Seafood Product Manufacturing.
Secretarial Schools.
Securities and Commodity Exchanges.
Security
Security and Investigations.
Security and Investigations.
Security Guards and Patrol Services.
Security Systems Services.
Security Systems Services.
Semiconductor Manufacturing.
Services for Renewable Energy.
Services for the Elderly and Disabled.
Sheet Music Publishing.
Shipbuilding.
Shuttles and Special Needs Transportation Services.
Sightseeing Transportation.
Sightseeing Transportation.
Skiing Facilities.
Soap and Cleaning Product Manufacturing.
Social Networking Platforms.
Software Development
Solar Electric Power Generation.
Sound Recording.
Space Research and Technology.
Specialty Trade Contractors.
Specialty Trade Contractors.
Spectator Sports
Sporting Goods Manufacturing.
Sporting Goods Manufacturing.
Sports and Recreation Instruction.
Sports Teams and Clubs.
Spring and Wire Product Manufacturing.
Staffing and Recruiting
Steam and Air-Conditioning Supply.
Strategic Management Services.
Subdivision of Land.
Sugar and Confectionery Product Manufacturing.
Surveying and Mapping Services.
Taxi and Limousine Services.
Technical and Vocational Training.
Technology, Information and Internet.
Technology, Information and Media
Telecommunications Carriers.
Telecommunications.
Telephone Call Centers.
Temporary Help Services.
Textile Manufacturing.
Textile Manufacturing.
Theater Companies.
Think Tanks.
Tobacco Manufacturing.
Translation and Localization.
Transportation
Transportation Equipment Manufacturing.
Transportation, Logistics, Supply Chain and Storage
Travel Arrangements
Travel Arrangements.
Truck Transportation.
Trusts and Estates.
Trusts and Estates.
Turned Products and Fastener Manufacturing.
Turned Products and Fastener Manufacturing.
Urban Transit Services.
Utilities
Utilities.
Utility System Construction.
Utility System Construction.
Vehicle Repair and Maintenance.
Venture Capital and Private Equity Principals.
Veterinary Services.
Vocational Rehabilitation Services.
Warehousing and Storage
Waste Collection.
Waste Treatment and Disposal.
Water Supply and Irrigation Systems.
Water, Waste, Steam, and Air Conditioning Services
Water, Waste, Steam, and Air Conditioning Services
Wellness and Fitness Services.
Wholesale
Wholesale Alcoholic Beverages.
Wholesale Apparel and Sewing Supplies.
Wholesale Appliances, Electrical, and Electronics.
Wholesale Building Materials.
Wholesale Chemical and Allied Products.
Wholesale Computer Equipment.
Wholesale Drugs and Sundries.
Wholesale Food and Beverage.
Wholesale Footwear.
Wholesale Furniture and Home Furnishings.
Wholesale Hardware, Plumbing, Heating Equipment.
Wholesale Import and Export.
Wholesale Luxury Goods and Jewelry.
Wholesale Machinery.
Wholesale Machinery.
Wholesale Metals and Minerals.
Wholesale Metals and Minerals.
Wholesale Motor Vehicles and Parts.
Wholesale Paper Products.
Wholesale Petroleum and Petroleum Products.
Wholesale Photography Equipment and Supplies.
Wholesale Photography Equipment and Supplies.
Wholesale Raw Farm Products.
Wholesale Recyclable Materials.
Wholesale.
Wind Electric Power Generation.
Wineries
Wireless Services.
Women's Handbag Manufacturing.
Wood Product Manufacturing.
Writing and Editing.
Zoos and Botanical Gardens.
`;

const filterNoise = (line) => {
    const lower = line.toLowerCase();
    if (lower.includes('ago')) return false;
    if (lower.includes('here\'s what you')) return false;
    if (lower.includes('driving business development')) return false;
    if (lower.includes('oggn\'s')) return false;
    if (lower.includes('recommended by linkedin')) return false;
    if (lower.includes('considering a career')) return false;
    if (line.trim().length < 3) return false;
    return true;
};

const lines = rawList.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => l.replace(/[.:;,\/]$/, '')) // Remove trailing punctuation
    .filter(filterNoise);

const unique = Array.from(new Set(lines)).sort();

fs.writeFileSync('industries.json', JSON.stringify(unique, null, 4));
console.log('Done');
