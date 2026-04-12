---
name: hvac-installation
version: "1.0.0"
domain: "HVAC Installation & Systems"
description: "A domain expert in HVAC system installation, sizing, maintenance, and troubleshooting. Covers residential and light commercial systems including split systems, packaged units, heat pumps, ductwork design, refrigerant handling, and code compliance. Does NOT cover industrial HVAC, building automation systems (BAS), or chiller plant design."
---

# HVAC Installation Expert Knowledgebase

## Domain Scope

**This knowledgebase covers:**
- Residential and light commercial HVAC systems (up to 25 tons)
- Split systems, packaged units, heat pumps, mini-splits
- Ductwork design, sizing, and installation
- Refrigerant handling and EPA regulations
- Load calculations and equipment sizing
- Thermostat and control wiring
- Code compliance (IMC, IRC, ACCA standards)
- Preventive maintenance and troubleshooting
- Energy efficiency and SEER/HSPF ratings

**This knowledgebase does NOT cover:**
- Industrial HVAC or process cooling
- Building automation systems (BAS/BMS)
- Chiller plant design or large commercial systems (>25 tons)
- Geothermal system design (beyond basic heat pump coverage)
- Solar HVAC or experimental technologies

## Core Knowledge

### System Types

#### Split Systems
The most common residential HVAC configuration. Consists of an outdoor condensing unit and an indoor air handler or furnace with evaporator coil.

**Components:**
- **Outdoor unit**: Compressor, condenser coil, condenser fan, contactor, capacitor
- **Indoor unit**: Evaporator coil, blower motor, expansion device (TXV or piston), air filter
- **Connecting**: Refrigerant line set (suction and liquid lines), thermostat wire, condensate drain

**Installation considerations:**
- Outdoor unit requires minimum clearances: 24" on service side, 12" on other sides, 48" above
- Line set length should not exceed manufacturer specification (typically 50-75 ft for residential)
- Indoor unit must be level or slightly tilted toward condensate drain
- Disconnect switch required within sight of outdoor unit per NEC 440.14

#### Packaged Units
Self-contained units with all components in a single outdoor cabinet. Common for rooftop installations and homes without basements/utility rooms.

**Key differences from split systems:**
- No refrigerant line set to install (factory-charged and sealed)
- Requires only ductwork connections, electrical, and thermostat wiring
- Typically installed on rooftops or ground-level concrete pads
- Supply and return duct connections on the unit

#### Ductless Mini-Splits
Individual zone-controlled systems with one outdoor unit serving one or more indoor wall/ceiling-mounted heads.

**Sizing guidelines:**
- 9,000 BTU: Rooms up to 300 sq ft
- 12,000 BTU: Rooms 300-500 sq ft
- 18,000 BTU: Rooms 500-800 sq ft
- 24,000 BTU: Rooms 800-1,100 sq ft

**Installation requirements:**
- Indoor head height: Minimum 7 ft from floor, 6" minimum from ceiling
- Condensate line must slope minimum 1/4" per foot toward drain
- Line set penetration through wall should slope slightly downward to exterior
- Multi-zone outdoor units: Maximum 8 indoor heads (varies by manufacturer)

#### Heat Pumps
Reversible refrigeration cycle systems that provide both heating and cooling. Available as split systems, packaged units, or mini-splits.

**Types:**
- **Air-source**: Most common, efficiency drops as outdoor temperature falls
- **Dual-fuel / Hybrid**: Heat pump with gas furnace backup for extreme cold
- **Cold-climate**: Engineered for operation down to -15F or lower

**Key specifications:**
- SEER2 (cooling efficiency): Minimum 14.3 for residential (as of Jan 2023)
- HSPF2 (heating efficiency): Minimum 7.5 for residential (as of Jan 2023)
- Balance point: Outdoor temperature where heat pump capacity equals building heat loss (typically 30-35F for standard units)
- Auxiliary/emergency heat strips for backup when outdoor temps drop below balance point

### Load Calculations

Proper equipment sizing requires a Manual J load calculation per ACCA standards. Oversizing causes short cycling, poor humidity control, and wasted energy. Undersizing causes inability to maintain setpoint in extreme conditions.

**Manual J inputs:**
- Building dimensions and square footage
- Insulation R-values (walls, ceiling, floor)
- Window types, sizes, orientation, and shading
- Infiltration rate (blower door test preferred)
- Number of occupants
- Internal heat gains (appliances, lighting)
- Local design temperatures (heating and cooling)
- Duct location and insulation

**Rules of thumb (for estimation only, not for final sizing):**
- 400-600 sq ft per ton in moderate climates
- 300-400 sq ft per ton in hot/humid climates
- Always use Manual J for final sizing; rules of thumb lead to oversizing

### Ductwork Design

#### Sizing (Manual D)
- Use ACCA Manual D for duct sizing based on friction rate and available static pressure
- Total external static pressure (ESP) must not exceed equipment rating (typically 0.5" WC for residential)
- Friction rate = Available static pressure / Total effective duct length
- Target friction rate: 0.08" WC per 100 ft of duct for residential

#### Materials
- **Sheet metal**: Most durable, lowest friction loss, used for main trunks. Gauge: 26 ga for up to 24" width, 24 ga for larger
- **Flex duct**: Used for branch runs. Must be pulled taut (max 4% sag). Maximum length per run: 25 ft
- **Duct board**: Rigid fiberglass with foil facing. Self-insulating (R-4.2 to R-6.5)

#### Installation Best Practices
- Seal all joints with mastic or UL 181-rated tape (no standard duct tape)
- Insulate all ducts in unconditioned spaces to minimum R-8 (climate dependent per IECC)
- Support flex duct every 5 ft maximum, with maximum sag of 1/2" per foot between supports
- Maintain minimum 1" clearance from combustible materials on single-wall flue pipes
- Return air pathways: Minimum 1 sq in of free area per CFM of supply air to each room

### Refrigerant Handling

#### EPA Section 608 Requirements
- Technicians must hold EPA Section 608 certification to purchase or handle regulated refrigerants
- Type I: Small appliances (under 5 lbs charge)
- Type II: High-pressure equipment (most residential/commercial)
- Type III: Low-pressure equipment (large chillers)
- Universal: All types
- Venting of refrigerants is illegal; must be recovered before system opening

#### Common Refrigerants
| Refrigerant | Type | GWP | Status |
|------------|------|-----|--------|
| R-410A | HFC blend | 2,088 | Current standard, being phased down |
| R-32 | HFC | 675 | Emerging replacement for R-410A |
| R-454B | HFO/HFC blend | 466 | Low-GWP replacement per AIM Act |
| R-22 | HCFC | 1,810 | Phased out (production banned Jan 2020) |

#### Charging Procedures
- **R-410A**: Charge in liquid state only (due to blend composition). Weigh in charge per manufacturer specification
- **Subcooling method** (TXV systems): Target subcooling per manufacturer (typically 10-12F). Subcooling = Liquid line saturation temp - Actual liquid line temp
- **Superheat method** (fixed orifice systems): Target superheat per manufacturer (typically 10-15F). Superheat = Actual suction line temp - Suction saturation temp
- Never mix refrigerants. System must be recovered, evacuated, and recharged if refrigerant type is changed

### Thermostat & Control Wiring

**Standard wire designations:**
| Terminal | Color (typical) | Function |
|----------|----------------|----------|
| R | Red | 24V power (from transformer) |
| C | Blue | 24V common (return) |
| G | Green | Fan (indoor blower) |
| Y | Yellow | Compressor / Cooling |
| W | White | Heat (gas valve or heat strips) |
| O/B | Orange | Reversing valve (heat pump) |
| Y2 | Light blue | Second-stage cooling |
| W2 | Brown | Second-stage heat / Aux heat |

**Best practices:**
- Use 18/8 thermostat wire minimum for new installations (extra conductors for future use)
- Always run a C (common) wire for modern smart thermostats
- Maximum wire run: 200 ft for 18 AWG
- Do not run thermostat wire in same conduit as line voltage wiring

## Common Questions & Answers

### Q: How do I determine the right size system for a home?
**A:** Perform a Manual J load calculation per ACCA standards. You will need the building dimensions, insulation values, window specifications, infiltration rate, local design temperatures, and internal heat gains. The calculated heating and cooling loads (in BTU/h) determine the equipment tonnage. Never rely solely on square footage rules of thumb, as they consistently lead to oversizing. Select equipment within 15% of the calculated load, rounding to the nearest available size.

### Q: What causes short cycling and how do I fix it?
**A:** Short cycling (compressor running less than 5 minutes per cycle) is most commonly caused by:
1. **Oversized equipment** (most common) - System reaches setpoint too quickly. Fix: Replace with properly sized unit per Manual J
2. **Dirty air filter** - Restricted airflow causes high head pressure or frozen coil. Fix: Replace filter
3. **Low refrigerant** - Low-pressure cutout trips. Fix: Find and repair leak, recharge
4. **Faulty thermostat or placement** - Located near heat source or supply register. Fix: Relocate
5. **Dirty condenser coil** - High head pressure triggers safety cutout. Fix: Clean coil

### Q: When should auxiliary heat vs. emergency heat be used on a heat pump?
**A:** Auxiliary (AUX) heat is automatic - the thermostat activates backup heat strips when the heat pump alone cannot maintain setpoint (typically 2F below setpoint or during defrost cycles). Emergency (EM) heat is a manual override that locks out the compressor and runs only on backup heat strips. Use emergency heat ONLY when the heat pump compressor has failed and you need temporary heating until repair. Running in emergency heat mode is significantly more expensive (2-3x the operating cost).

### Q: What is the required clearance around an outdoor condensing unit?
**A:** Follow the manufacturer's installation manual for specific clearances. General minimums are: 24" on the service access side, 12" on remaining sides, 48" above the unit, and 12" between units if side-by-side. Keep the area clear of vegetation, debris, and structures that could restrict airflow. The unit should be on a level pad (concrete or composite) at least 3" above grade to prevent snow/debris accumulation.

## Standards & References

- **ACCA Manual J** - Residential load calculation
- **ACCA Manual D** - Residential duct design
- **ACCA Manual S** - Residential equipment selection
- **International Mechanical Code (IMC)** - Commercial mechanical systems
- **International Residential Code (IRC) Chapter 14** - Heating and cooling
- **International Energy Conservation Code (IECC)** - Energy efficiency requirements
- **ASHRAE 62.1/62.2** - Ventilation for acceptable indoor air quality
- **EPA Section 608** - Refrigerant handling regulations
- **NEC Article 440** - Air conditioning and refrigeration equipment electrical
- **AIM Act (2020)** - HFC phasedown schedule

## Terminology

| Term | Definition |
|------|-----------|
| SEER2 | Seasonal Energy Efficiency Ratio (cooling). Higher = more efficient. Tested under updated M1 procedure. |
| HSPF2 | Heating Seasonal Performance Factor. Higher = more efficient. Heat pump heating metric. |
| AFUE | Annual Fuel Utilization Efficiency. Percentage of fuel converted to heat in a furnace. |
| TXV | Thermostatic Expansion Valve. Metering device that regulates refrigerant flow to the evaporator. |
| Subcooling | Temperature difference between the liquid refrigerant and its saturation temperature. Indicates charge level on TXV systems. |
| Superheat | Temperature difference between the suction gas and its saturation temperature. Indicates charge level on fixed-orifice systems. |
| CFM | Cubic Feet per Minute. Measure of airflow volume. Target: 400 CFM per ton for cooling. |
| Static Pressure | Resistance to airflow in a duct system, measured in inches of water column (WC). |
| Tonnage | Cooling capacity measurement. 1 ton = 12,000 BTU/h of cooling. |
| Balance Point | Outdoor temperature where heat pump heating capacity equals building heat loss. |
| Defrost Cycle | Automatic reversal of heat pump operation to melt ice from the outdoor coil during heating mode. |
| Line Set | Copper tubing connecting indoor and outdoor units. Includes suction (large, insulated) and liquid (small) lines. |

## Safety Considerations

- **Electrical**: Always de-energize equipment before service. Capacitors retain lethal charge - discharge before handling. Follow NFPA 70E for electrical safety.
- **Refrigerant**: EPA certification required. Work in ventilated areas - refrigerant displaces oxygen. Never use open flame near refrigerants (produces phosgene gas). Wear safety glasses and gloves.
- **Combustion**: Gas furnaces require proper venting. Test for carbon monoxide with calibrated instrument. Verify gas line pressure with manometer. Never bypass safety controls.
- **Fall protection**: Rooftop installations require fall protection per OSHA 1926.501. Use proper harnesses and anchor points.
- **Lifting**: Condensing units weigh 100-400+ lbs. Use proper lifting equipment and techniques. Never lift by the refrigerant lines.
- **Licensing**: Most jurisdictions require HVAC contractor licensing. Verify local requirements for permits, inspections, and bonding.
