ObservedAt: 2026-10-16T20:07:51.839Z
Browser tab: 2, Title: "ERA5 | Arraylake Marketplace", URL: "https://app.earthmover.io/marketplace/6a19bcfe9aa6e97720a2fad2?path=single%2Ftemporal%2Fstatus&access_method=direct".
0 AXWebArea ERA5 | Arraylake Marketplace, URL: app.earthmover.io/marketplace/6a19bcfe9aa6e97720a2fad2?path=single%2Ftemporal%2Fstatus&access_method=direct
	1 container
		57 text ERA5
		2 container mantine-d4zsjbbi9
			3 container
				4 link Description: Home, Value: app.earthmover.io/
				5 link Description: Marketplace, Value: app.earthmover.io/marketplace
				6 text /
				7 link Description: ERA5, Value: app.earthmover.io/marketplace/6a19bcfe9aa6e97720a2fad2
				8 link Description: Log In, Value: app.earthmover.io/auth/login
			9 container
				17 link Description: Earthmover Datasets Earthmover Datasets, Value: app.earthmover.io/marketplace/providers/earthmover-public
				18 image
				19 text ICECHUNK
				20 heading ERA5, Value: 1
					21 text ERA5
				22 text ECMWF ERA5 hourly single and pressure levels starting 1940-01-01, updated every three months.
				23 button Data Access
				24 container listing-tabs
					25 tab group
						26 tab (selected, settable, boolean) README, Value: 1, ID: listing-tabs-tab-readme
						27 tab (selectable, settable, boolean) Dataset, Value: 0, ID: listing-tabs-tab-dataset
						28 tab (selectable, settable, boolean) License, Value: 0, ID: listing-tabs-tab-license
					29 container Description: README, ID: listing-tabs-panel-readme
						58 container
							59 text This is the free version of ERA5.
							60 text  For a low-latency, commercially licensed version, see 
							61 link Description: ERA5 (daily updates), Value: app.earthmover.io/marketplace/6a18ae1ba1c8feafd01f2b76
							62 text ERA5 is the fifth-generation global reanalysis produced by the Copernicus Climate Change Service at ECMWF, providing hourly estimates of atmospheric, land-surface, and ocean variables starting 1940 on a ~31 km (0.25°) grid. This Earthmover analysis-ready cloud-optimized (ARCO) edition delivers 38 single-level surface variables, 8 pressure-level variables on 13 levels, and a curated 500 hPa geopotential slice, all hosted as a single Icechunk Zarr v3 store on AWS S3 us-east-1, optimized for both spatial and temporal analysis patterns through dual chunking strategies. This dataset is free and available via a CC-BY 4.0 license.
							63 heading Data Characteristics, Value: 2, ID: user-content-data-characteristics
								64 text Data Characteristics
							65 heading Data Variables, Value: 3, ID: user-content-data-variables
								66 text Data Variables
							67 text The repository is organized into three top-level groups: 
							68 text single
							69 text , 
							70 text pressure
							71 text  (13 isobaric levels), and 
							72 text 500hPa
							73 text  (z at 500 hPa only). All variables are provided on the native 0.25° regular lat/lon grid with CF-1.7 compliant metadata.
							74 heading Single levels (surface) — single/, Value: 4, ID: user-content-single-levels-surface--single
								75 text Single levels (surface) — 
								76 text single/
							77 text 35 hourly variables covering temperature & moisture, wind & momentum, precipitation & clouds, and radiation.
							78 heading Pressure levels — pressure/, Value: 4, ID: user-content-pressure-levels--pressure
								79 text Pressure levels — 
								80 text pressure/
							81 text 8 hourly variables (temperature, wind components, vertical velocity, humidity, geopotential, potential vorticity) on 13 isobaric levels from 50 to 1000 hPa.
							82 heading 500 hPa geopotential — 500hPa/, Value: 4, ID: user-content-500-hpa-geopotential--500hpa
								83 text 500 hPa geopotential — 
								84 text 500hPa/
							85 text Geopotential at 500 hPa carved from 
							86 text pressure/
							87 text  as a single-level slice.
							88 heading Organization, Optimization, and Chunking, Value: 3, ID: user-content-organization-optimization-and-chunking
								89 text Organization, Optimization, and Chunking
							90 text Each top-level group contains two subgroups with complementary chunking strategies. Both subgroups hold identical variables and data; only the chunk layout differs.
							91 text Spatial subgroup
							92 text  (
							93 text {group}/spatial/
							94 text , valid_time=1, latitude=721, longitude=1440):
							95 content list
								96 container
									97 AXListMarker • 
									98 text One full global map per hour (pancake chunks)
								99 container
									100 AXListMarker • 
									101 text Optimized for map-style queries, regional extractions, spatial pattern analysis
								102 container
									103 AXListMarker • 
									104 text Fast access to complete spatial fields at specific times
							105 text Temporal subgroup
							106 text  (
							107 text {group}/temporal/
							108 text , valid_time=8736, latitude=12, longitude=12):
							109 content list
								110 container
									111 AXListMarker • 
									112 text One year of hourly data per chunk with small spatial tiles
								113 container
									114 AXListMarker • 
									115 text Optimized for time-series extraction, location-based analysis, ML training workflows
								116 container
									117 AXListMarker • 
									118 text Efficient loading of multi-year temporal sequences at fixed locations
							119 text Arrays are stored as Float32 with PCodec filter for higher compression ratios. Each subgroup also exposes a 
							120 text status/
							121 text  group recording per-hour QC flags and 
							122 text expver
							123 text  per variable. Query patterns that work well:
							124 content list
								125 container
									126 AXListMarker • 
									127 text Global or regional spatial snapshots (spatial subgroup)
								128 container
									129 AXListMarker • 
									130 text Multi-year time series at specific locations (temporal subgroup)
								131 container
									132 AXListMarker • 
									133 text Climate trend analysis across decades (temporal subgroup)
								134 container
									135 AXListMarker • 
									136 text Weather pattern visualization and mapping (spatial subgroup)
							137 heading Coordinates, Value: 3, ID: user-content-coordinates
								138 text Coordinates
							139 content list
								140 container
									141 AXListMarker • 
									142 text valid_time : January 1, 1940 00:00 UTC to June 30, 2026 23:00:00 UTC at hourly intervals
								143 container
									144 AXListMarker • 
									145 text latitude : 90°N to 90°S at 0.25° resolution (721 grid points)
								146 container
									147 AXListMarker • 
									148 text longitude : 0°E to 359.75°E at 0.25° resolution (1,440 grid points)
								149 container
									150 AXListMarker • 
									151 text pressure_level  ( pressure/  only): 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 850, 925, 1000 hPa (13 levels)
								152 container
									153 AXListMarker • 
									154 text lsm : Land-sea mask (0–1) carried as a 2D non-dimensional coordinate on each subgroup
								155 container
									156 AXListMarker • 
									157 text expver  ( {group}/{access}/status  only):  5  for 5 days behind real time published as near-realtime ERA5T  expver=0005  or  1  for final ERA5 published as  expver=0001
							158 text The 0.25° resolution captures synoptic-scale weather patterns while maintaining manageable data volumes for large-scale climate analysis and ML applications.
							159 heading Update Frequency and Latency, Value: 3, ID: user-content-update-frequency-and-latency
								160 text Update Frequency and Latency
							161 text This is a historical reanalysis dataset starting 1940. The dataset is updated on quarterly basis (every three months) with a minimum lag of three months to 
							162 link Description: ERA5 (daily updates), Value: app.earthmover.io/marketplace/6a18ae1ba1c8feafd01f2b76
							163 text . Updates extend the temporal coverage forward while maintaining consistency with the existing archive. If you need more recent ERA5 data, consider the 
							164 link Description: ERA5 (daily updates) listing, Value: app.earthmover.io/marketplace/6a18ae1ba1c8feafd01f2b76
							165 text .
							166 heading Provenance and Processing, Value: 2, ID: user-content-provenance-and-processing
								167 text Provenance and Processing
							168 heading Inputs, Value: 3, ID: user-content-inputs
								169 text Inputs
							170 text This dataset is sourced from two upstream feeds, joined on a known cutover date:
							171 content list
								172 container
									173 AXListMarker 1. 
									174 text NSF NCAR Curated ERA5  (
									175 link Description: rda.ucar.edu/datasets/ds633.0, Value: rda.ucar.edu/datasets/ds633.0/
									176 text , DOI: 10.5065/BH6N-5N20) for the historical backfill (1940 through 2026-01). This collection republishes ECMWF's ERA5 reanalysis as CF-compliant NetCDF-4 files on AWS S3.
								177 container
									178 AXListMarker 2. 
									179 text Copernicus Climate Data Store  (
									180 link Description: cds.climate.copernicus.eu, Value: cds.climate.copernicus.eu/
									181 text ) for the 2026-onward daily-append leg, hitting  reanalysis-era5-single-levels  and  reanalysis-era5-pressure-levels .
							182 text This data is produced and disseminated in accordance with the Copernicus License. Earthmover hereby informs the recipient of this dataset of the following:
							183 text This dataset was generated using Copernicus Climate Change Service information 2026.
							184 text We hereby cite the CDS:
							185 content list
								186 container
									187 AXListMarker • 
									188 text Copernicus Climate Change Service, Climate Data Store, (2023): ERA5 hourly data on single levels from 1940 to present. Copernicus Climate Change Service (C3S) Climate Data Store (CDS). DOI: 
									189 link Description: https://doi.org/10.24381/cds.adbb2d47, Value: doi.org/10.24381/cds.adbb2d47
									190 text  (Accessed in 2026)
								191 container
									192 AXListMarker • 
									193 text Copernicus Climate Change Service, Climate Data Store, (2023): ERA5 hourly data on pressure levels from 1940 to present. Copernicus Climate Change Service (C3S) Climate Data Store (CDS). DOI: 
									194 link Description: https://doi.org/10.24381/cds.bd0915c6, Value: doi.org/10.24381/cds.bd0915c6
									195 text  (Accessed in 2026)
							196 text We also acknowledge the NSF NCAR dataset:
							197 container
								198 text NSF NCAR Curated ECMWF Reanalysis 5 (ERA5) was accessed in 2026 from 
								199 link Description: https://registry.opendata.aws/nsf-ncar-era5, Value: registry.opendata.aws/nsf-ncar-era5
								200 text . European Centre for Medium-Range Weather Forecasts. 2019, updated monthly. ERA5 Reanalysis (0.25 Degree Latitude-Longitude Grid). Research Data Archive at the National Center for Atmospheric Research, Computational and Information Systems Laboratory. 
								201 link Description: https://doi.org/10.5065/BH6N-5N20, Value: doi.org/10.5065/BH6N-5N20
								202 text .
							203 text Both sources distribute data under a Creative Commons CC-BY 4.0, enabling flexible reuse with proper attribution.
							204 heading Processing, Value: 3, ID: user-content-processing
								205 text Processing
							206 text The processing pipeline ingests both upstream feeds into a single versioned Icechunk store:
							207 content list
								208 container
									209 AXListMarker 1. 
									210 text Variable selection : Extract variables from ERA5 archives
							211 content list
								212 container
									213 AXListMarker • 
									214 text Historical backfill (1940–2026-01) : from NSF NCAR Curated ERA5
								215 container
									216 AXListMarker • 
									217 text Daily append (starting 2026-01) : download from CDS
							218 content list
								219 container
									220 AXListMarker 2. 
									221 text Dual chunking : Ingest every variable to
							222 content list
								223 container
									224 AXListMarker • 
									225 text spatial/  pancake chunks: (1 x 721 x 1440) for map-based queries
								226 container
									227 AXListMarker • 
									228 text temporal/  spaghetti chunks: small spatial tiles, close to one year per chunk: (8736 x 12 x 12) for time-series analysis
							229 heading External Links, Value: 3, ID: user-content-external-links
								230 text External Links
							231 content list
								232 container
									233 AXListMarker • 
									234 link Description: NSF NCAR Curated ERA5 (ds633.0), Value: rda.ucar.edu/datasets/ds633.0/
								235 container
									236 AXListMarker • 
									237 link Description: ECMWF ERA5 Documentation, Value: confluence.ecmwf.int/display/CKB/ERA5
								238 container
									239 AXListMarker • 
									240 link Description: Copernicus Climate Data Store, Value: cds.climate.copernicus.eu/
								241 container
									242 AXListMarker • 
									243 link Description: CDS: reanalysis-era5-single-levels, Value: cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels
								244 container
									245 AXListMarker • 
									246 link Description: CDS: reanalysis-era5-pressure-levels, Value: cds.climate.copernicus.eu/datasets/reanalysis-era5-pressure-levels
								247 container
									248 AXListMarker • 
									249 link Description: ERA5 Data Documentation, Value: confluence.ecmwf.int/display/CKB/ERA5%3A+data+documentation
							250 heading Changelog, Value: 3, ID: user-content-changelog
								251 text Changelog
							252 text No changelog entries yet. Initial version covers 1940-01-01 to present and is updated daily.
							253 heading Applications, Value: 2, ID: user-content-applications
								254 text Applications
							255 heading Use Cases, Value: 3, ID: user-content-use-cases
								256 text Use Cases
							257 content list
								258 container
									259 AXListMarker • 
									260 text Climate change analysis : Long-term trend analysis of temperature, precipitation, and atmospheric conditions across 85+ years
								261 container
									262 AXListMarker • 
									263 text Machine learning for weather : Training data for AI/ML weather prediction models with optimized temporal chunking for efficient data loading on full surface and pressure variable sets
								264 container
									265 AXListMarker • 
									266 text Extreme weather studies : Hourly resolution investigation of heat waves, cold snaps, storms, and other extreme events
								267 container
									268 AXListMarker • 
									269 text Renewable energy assessment : Wind resource analysis using 10 m and 100 m wind components; solar resource evaluation using radiation variables
								270 container
									271 AXListMarker • 
									272 text Agriculture and food security : Soil moisture, multi-layer soil temperature, and precipitation analysis for crop modeling and yield prediction
								273 container
									274 AXListMarker • 
									275 text Hydrological modeling : Precipitation, snowfall, snow depth, and soil moisture inputs for watershed and flood forecasting models
								276 container
									277 AXListMarker • 
									278 text Climate model validation : Benchmark dataset for evaluating regional and global climate model performance
								279 container
									280 AXListMarker • 
									281 text Synoptic and dynamical meteorology : 500 hPa geopotential and full pressure-level fields for wave activity, jet stream, and storm-track analysis
								282 container
									283 AXListMarker • 
									284 text Air quality modeling : Boundary layer height and meteorological inputs for pollution dispersion models
								285 container
									286 AXListMarker • 
									287 text Ocean-atmosphere studies : Sea surface temperature and surface flux variables for studying air-sea interactions
							288 heading Example Code, Value: 3, ID: user-content-example-code
								289 text Example Code
							290 text Opening the surface spatial group:
							291 container
								292 text from  arraylake  import  Client
 import  xarray  as  xr
 client  =  Client ( ) repo  =  client . get_repo ( "earthmover-public/era5" ) session  =  repo . readonly_session ( "main" ) ds_spatial  =  xr . open_zarr ( session . store ,  group = "single/spatial" ,  chunks = None ) ds_spatial . t2m . sel ( valid_time = "2018-01-01 12:00" ) . plot ( cmap = "coolwarm" ,  robust = True )
							293 text Time series at a location (surface temporal group):
							294 container
								295 text ds_temporal  =  xr . open_zarr ( session . store ,  group = "single/temporal" ,  chunks = None ) location_ts  =  ds_temporal . t2m . sel (     longitude = 106 ,     latitude = 4 ,     valid_time = slice ( "1995" , "2000" ) , ) location_ts . plot ( )
							296 text Regional wind energy resource assessment over time (100 m wind speed):
							297 container
								298 text ds_t  =   xr . open_zarr ( session . store ,  group = "single/temporal" ,  chunks = None ) wind_speed_100m  = ( ds_t . u100 ** 2 +  ds_t . v100 ** 2 ) ** 0.5 regional_wind  =  wind_speed_100m . sel (     longitude = slice ( 5 , 15 ) ,     latitude = slice ( 55 , 50 ) ,     valid_time = slice ( "2020" , "2024" ) , ) . mean ( dim = "valid_time" ) regional_wind . plot ( )
							299 text Additional examples available in the 
							300 link Description: Earthmover documentation, Value: docs.earthmover.io/sample-data/era5
							301 text .
							302 heading Verification, Value: 2, ID: user-content-verification
								303 text Verification
							304 text A 
							305 link Description: standalone tool, Value: github.com/earth-mover/era5-qc
							306 text  is available to verify correctness of the data against the original ECMWF CDS data.
					39 container ERA5
					40 heading Details, Value: 4
						41 text Details
					42 text Cloud
					43 image
					44 text Amazon S3
					45 text Region
					46 text us-east-1
					47 heading About this provider, Value: 4
						48 text About this provider
					49 link Description: Earthmover Datasets Earthmover Datasets, Value: app.earthmover.io/marketplace/providers/earthmover-public
					50 text Datasets managed and curated directly by Earthmover.
					51 link Description: Contact, Value: mailto:sales@earthmover.io
					52 link earthmover.io/
					53 link Description: Github, Value: github.com/earth-mover
					54 link Description: Linkedin, Value: linkedin.com/company/earthmover
					55 link Description: @earthmover.io, Value: bsky.app/profile/earthmover.io
					56 link Description: Slack, Value: join.slack.com/t/earthmover-community/shared_invite/zt-2cwje92ir-xU3CfdG8BI~4CJOJy~sceQ
				10 text ©  2026 Earthmover PBC Powered by
				11 link Description: Earthmover.io, Value: earthmover.io/
				12 content list
					13 link Description: Docs, Value: docs.earthmover.io/
					14 link Description: About, Value: earthmover.io/about
					15 link Description: Terms, Value: docs.earthmover.io/terms-of-service
					16 link Description: GitHub, Value: github.com/earth-mover

The focused UI element is 26 tab (selected, settable, boolean) README, Value: 1, ID: listing-tabs-tab-readme