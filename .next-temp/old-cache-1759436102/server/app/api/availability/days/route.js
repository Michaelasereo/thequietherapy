/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/availability/days/route";
exports.ids = ["app/api/availability/days/route"];
exports.modules = {

/***/ "(rsc)/./app/api/availability/days/route.ts":
/*!********************************************!*\
  !*** ./app/api/availability/days/route.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\n\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(\"https://frzciymslvpohhyefmtr.supabase.co\", process.env.SUPABASE_SERVICE_ROLE_KEY);\n/**\n * Get available dates for a therapist within a date range\n * Returns dates that have at least one available time slot\n */ async function GET(request) {\n    try {\n        const { searchParams } = new URL(request.url);\n        const therapistId = searchParams.get('therapist_id');\n        const startDate = searchParams.get('start_date');\n        const endDate = searchParams.get('end_date');\n        if (!therapistId || !startDate || !endDate) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Missing required parameters: therapist_id, start_date, end_date'\n            }, {\n                status: 400\n            });\n        }\n        // Validate date format\n        const startDateObj = new Date(startDate);\n        const endDateObj = new Date(endDate);\n        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Invalid date format. Use YYYY-MM-DD format.'\n            }, {\n                status: 400\n            });\n        }\n        console.log('🔍 Fetching available days for therapist:', therapistId, 'from', startDate, 'to', endDate);\n        // Use the generate_availability_slots function to get all available slots\n        const { data: slots, error } = await supabase.rpc('generate_availability_slots', {\n            p_therapist_id: therapistId,\n            p_start_date: startDate,\n            p_end_date: endDate\n        });\n        if (error) {\n            console.error('Error generating availability slots:', error);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Failed to generate availability slots',\n                details: error.message\n            }, {\n                status: 500\n            });\n        }\n        // Extract unique dates that have availability\n        const availableDates = [\n            ...new Set(slots?.map((slot)=>slot.date) || [])\n        ].filter((date)=>date) // Remove null/undefined dates\n        .sort(); // Sort chronologically\n        console.log('✅ Found', availableDates.length, 'available dates');\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: true,\n            availableDays: availableDates,\n            totalDays: availableDates.length,\n            therapist_id: therapistId,\n            date_range: {\n                start_date: startDate,\n                end_date: endDate\n            }\n        }, {\n            status: 200\n        });\n    } catch (error) {\n        console.error('Error in availability days API:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Internal server error'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2F2YWlsYWJpbGl0eS9kYXlzL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUF3RDtBQUNIO0FBRXJELE1BQU1FLFdBQVdELG1FQUFZQSxDQUMzQkUsMENBQW9DLEVBQ3BDQSxRQUFRQyxHQUFHLENBQUNFLHlCQUF5QjtBQUd2Qzs7O0NBR0MsR0FDTSxlQUFlQyxJQUFJQyxPQUFvQjtJQUM1QyxJQUFJO1FBQ0YsTUFBTSxFQUFFQyxZQUFZLEVBQUUsR0FBRyxJQUFJQyxJQUFJRixRQUFRRyxHQUFHO1FBQzVDLE1BQU1DLGNBQWNILGFBQWFJLEdBQUcsQ0FBQztRQUNyQyxNQUFNQyxZQUFZTCxhQUFhSSxHQUFHLENBQUM7UUFDbkMsTUFBTUUsVUFBVU4sYUFBYUksR0FBRyxDQUFDO1FBRWpDLElBQUksQ0FBQ0QsZUFBZSxDQUFDRSxhQUFhLENBQUNDLFNBQVM7WUFDMUMsT0FBT2YscURBQVlBLENBQUNnQixJQUFJLENBQUM7Z0JBQ3ZCQyxPQUFPO1lBQ1QsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ25CO1FBRUEsdUJBQXVCO1FBQ3ZCLE1BQU1DLGVBQWUsSUFBSUMsS0FBS047UUFDOUIsTUFBTU8sYUFBYSxJQUFJRCxLQUFLTDtRQUU1QixJQUFJTyxNQUFNSCxhQUFhSSxPQUFPLE9BQU9ELE1BQU1ELFdBQVdFLE9BQU8sS0FBSztZQUNoRSxPQUFPdkIscURBQVlBLENBQUNnQixJQUFJLENBQUM7Z0JBQ3ZCQyxPQUFPO1lBQ1QsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ25CO1FBRUFNLFFBQVFDLEdBQUcsQ0FBQyw2Q0FBNkNiLGFBQWEsUUFBUUUsV0FBVyxNQUFNQztRQUUvRiwwRUFBMEU7UUFDMUUsTUFBTSxFQUFFVyxNQUFNQyxLQUFLLEVBQUVWLEtBQUssRUFBRSxHQUFHLE1BQU1mLFNBQ2xDMEIsR0FBRyxDQUFDLCtCQUErQjtZQUNsQ0MsZ0JBQWdCakI7WUFDaEJrQixjQUFjaEI7WUFDZGlCLFlBQVloQjtRQUNkO1FBRUYsSUFBSUUsT0FBTztZQUNUTyxRQUFRUCxLQUFLLENBQUMsd0NBQXdDQTtZQUN0RCxPQUFPakIscURBQVlBLENBQUNnQixJQUFJLENBQUM7Z0JBQ3ZCQyxPQUFPO2dCQUNQZSxTQUFTZixNQUFNZ0IsT0FBTztZQUN4QixHQUFHO2dCQUFFZixRQUFRO1lBQUk7UUFDbkI7UUFFQSw4Q0FBOEM7UUFDOUMsTUFBTWdCLGlCQUFpQjtlQUFJLElBQUlDLElBQUlSLE9BQU9TLElBQUksQ0FBQ0MsT0FBY0EsS0FBS0MsSUFBSSxLQUFLLEVBQUU7U0FBRSxDQUM1RUMsTUFBTSxDQUFDRCxDQUFBQSxPQUFRQSxNQUFNLDhCQUE4QjtTQUNuREUsSUFBSSxJQUFJLHVCQUF1QjtRQUVsQ2hCLFFBQVFDLEdBQUcsQ0FBQyxXQUFXUyxlQUFlTyxNQUFNLEVBQUU7UUFFOUMsT0FBT3pDLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDO1lBQ3ZCMEIsU0FBUztZQUNUQyxlQUFlVDtZQUNmVSxXQUFXVixlQUFlTyxNQUFNO1lBQ2hDSSxjQUFjakM7WUFDZGtDLFlBQVk7Z0JBQUVDLFlBQVlqQztnQkFBV2tDLFVBQVVqQztZQUFRO1FBQ3pELEdBQUc7WUFBRUcsUUFBUTtRQUFJO0lBRW5CLEVBQUUsT0FBT0QsT0FBTztRQUNkTyxRQUFRUCxLQUFLLENBQUMsbUNBQW1DQTtRQUNqRCxPQUFPakIscURBQVlBLENBQUNnQixJQUFJLENBQUM7WUFDdkJDLE9BQU87UUFDVCxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUNuQjtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMvbWFjYm9vay9EZXNrdG9wL3RycGktYXBwL2FwcC9hcGkvYXZhaWxhYmlsaXR5L2RheXMvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcbmltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyc7XG5cbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KFxuICBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwhLFxuICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIVxuKTtcblxuLyoqXG4gKiBHZXQgYXZhaWxhYmxlIGRhdGVzIGZvciBhIHRoZXJhcGlzdCB3aXRoaW4gYSBkYXRlIHJhbmdlXG4gKiBSZXR1cm5zIGRhdGVzIHRoYXQgaGF2ZSBhdCBsZWFzdCBvbmUgYXZhaWxhYmxlIHRpbWUgc2xvdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzZWFyY2hQYXJhbXMgfSA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuICAgIGNvbnN0IHRoZXJhcGlzdElkID0gc2VhcmNoUGFyYW1zLmdldCgndGhlcmFwaXN0X2lkJyk7XG4gICAgY29uc3Qgc3RhcnREYXRlID0gc2VhcmNoUGFyYW1zLmdldCgnc3RhcnRfZGF0ZScpO1xuICAgIGNvbnN0IGVuZERhdGUgPSBzZWFyY2hQYXJhbXMuZ2V0KCdlbmRfZGF0ZScpO1xuXG4gICAgaWYgKCF0aGVyYXBpc3RJZCB8fCAhc3RhcnREYXRlIHx8ICFlbmREYXRlKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBcbiAgICAgICAgZXJyb3I6ICdNaXNzaW5nIHJlcXVpcmVkIHBhcmFtZXRlcnM6IHRoZXJhcGlzdF9pZCwgc3RhcnRfZGF0ZSwgZW5kX2RhdGUnIFxuICAgICAgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBkYXRlIGZvcm1hdFxuICAgIGNvbnN0IHN0YXJ0RGF0ZU9iaiA9IG5ldyBEYXRlKHN0YXJ0RGF0ZSk7XG4gICAgY29uc3QgZW5kRGF0ZU9iaiA9IG5ldyBEYXRlKGVuZERhdGUpO1xuICAgIFxuICAgIGlmIChpc05hTihzdGFydERhdGVPYmouZ2V0VGltZSgpKSB8fCBpc05hTihlbmREYXRlT2JqLmdldFRpbWUoKSkpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IFxuICAgICAgICBlcnJvcjogJ0ludmFsaWQgZGF0ZSBmb3JtYXQuIFVzZSBZWVlZLU1NLUREIGZvcm1hdC4nIFxuICAgICAgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn8J+UjSBGZXRjaGluZyBhdmFpbGFibGUgZGF5cyBmb3IgdGhlcmFwaXN0OicsIHRoZXJhcGlzdElkLCAnZnJvbScsIHN0YXJ0RGF0ZSwgJ3RvJywgZW5kRGF0ZSk7XG5cbiAgICAvLyBVc2UgdGhlIGdlbmVyYXRlX2F2YWlsYWJpbGl0eV9zbG90cyBmdW5jdGlvbiB0byBnZXQgYWxsIGF2YWlsYWJsZSBzbG90c1xuICAgIGNvbnN0IHsgZGF0YTogc2xvdHMsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgLnJwYygnZ2VuZXJhdGVfYXZhaWxhYmlsaXR5X3Nsb3RzJywge1xuICAgICAgICBwX3RoZXJhcGlzdF9pZDogdGhlcmFwaXN0SWQsXG4gICAgICAgIHBfc3RhcnRfZGF0ZTogc3RhcnREYXRlLFxuICAgICAgICBwX2VuZF9kYXRlOiBlbmREYXRlXG4gICAgICB9KTtcblxuICAgIGlmIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBhdmFpbGFiaWxpdHkgc2xvdHM6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgXG4gICAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGdlbmVyYXRlIGF2YWlsYWJpbGl0eSBzbG90cycsXG4gICAgICAgIGRldGFpbHM6IGVycm9yLm1lc3NhZ2UgXG4gICAgICB9LCB7IHN0YXR1czogNTAwIH0pO1xuICAgIH1cblxuICAgIC8vIEV4dHJhY3QgdW5pcXVlIGRhdGVzIHRoYXQgaGF2ZSBhdmFpbGFiaWxpdHlcbiAgICBjb25zdCBhdmFpbGFibGVEYXRlcyA9IFsuLi5uZXcgU2V0KHNsb3RzPy5tYXAoKHNsb3Q6IGFueSkgPT4gc2xvdC5kYXRlKSB8fCBbXSldXG4gICAgICAuZmlsdGVyKGRhdGUgPT4gZGF0ZSkgLy8gUmVtb3ZlIG51bGwvdW5kZWZpbmVkIGRhdGVzXG4gICAgICAuc29ydCgpOyAvLyBTb3J0IGNocm9ub2xvZ2ljYWxseVxuXG4gICAgY29uc29sZS5sb2coJ+KchSBGb3VuZCcsIGF2YWlsYWJsZURhdGVzLmxlbmd0aCwgJ2F2YWlsYWJsZSBkYXRlcycpO1xuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgXG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgYXZhaWxhYmxlRGF5czogYXZhaWxhYmxlRGF0ZXMsXG4gICAgICB0b3RhbERheXM6IGF2YWlsYWJsZURhdGVzLmxlbmd0aCxcbiAgICAgIHRoZXJhcGlzdF9pZDogdGhlcmFwaXN0SWQsXG4gICAgICBkYXRlX3JhbmdlOiB7IHN0YXJ0X2RhdGU6IHN0YXJ0RGF0ZSwgZW5kX2RhdGU6IGVuZERhdGUgfVxuICAgIH0sIHsgc3RhdHVzOiAyMDAgfSk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBhdmFpbGFiaWxpdHkgZGF5cyBBUEk6JywgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IFxuICAgICAgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIFxuICAgIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJjcmVhdGVDbGllbnQiLCJzdXBhYmFzZSIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIiwiR0VUIiwicmVxdWVzdCIsInNlYXJjaFBhcmFtcyIsIlVSTCIsInVybCIsInRoZXJhcGlzdElkIiwiZ2V0Iiwic3RhcnREYXRlIiwiZW5kRGF0ZSIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsInN0YXJ0RGF0ZU9iaiIsIkRhdGUiLCJlbmREYXRlT2JqIiwiaXNOYU4iLCJnZXRUaW1lIiwiY29uc29sZSIsImxvZyIsImRhdGEiLCJzbG90cyIsInJwYyIsInBfdGhlcmFwaXN0X2lkIiwicF9zdGFydF9kYXRlIiwicF9lbmRfZGF0ZSIsImRldGFpbHMiLCJtZXNzYWdlIiwiYXZhaWxhYmxlRGF0ZXMiLCJTZXQiLCJtYXAiLCJzbG90IiwiZGF0ZSIsImZpbHRlciIsInNvcnQiLCJsZW5ndGgiLCJzdWNjZXNzIiwiYXZhaWxhYmxlRGF5cyIsInRvdGFsRGF5cyIsInRoZXJhcGlzdF9pZCIsImRhdGVfcmFuZ2UiLCJzdGFydF9kYXRlIiwiZW5kX2RhdGUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/availability/days/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Favailability%2Fdays%2Froute&page=%2Fapi%2Favailability%2Fdays%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Favailability%2Fdays%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Favailability%2Fdays%2Froute&page=%2Fapi%2Favailability%2Fdays%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Favailability%2Fdays%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_macbook_Desktop_trpi_app_app_api_availability_days_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/availability/days/route.ts */ \"(rsc)/./app/api/availability/days/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/availability/days/route\",\n        pathname: \"/api/availability/days\",\n        filename: \"route\",\n        bundlePath: \"app/api/availability/days/route\"\n    },\n    resolvedPagePath: \"/Users/macbook/Desktop/trpi-app/app/api/availability/days/route.ts\",\n    nextConfigOutput,\n    userland: _Users_macbook_Desktop_trpi_app_app_api_availability_days_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhdmFpbGFiaWxpdHklMkZkYXlzJTJGcm91dGUmcGFnZT0lMkZhcGklMkZhdmFpbGFiaWxpdHklMkZkYXlzJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGYXZhaWxhYmlsaXR5JTJGZGF5cyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRm1hY2Jvb2slMkZEZXNrdG9wJTJGdHJwaS1hcHAlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGbWFjYm9vayUyRkRlc2t0b3AlMkZ0cnBpLWFwcCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD1zdGFuZGFsb25lJnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ2tCO0FBQy9GO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvbWFjYm9vay9EZXNrdG9wL3RycGktYXBwL2FwcC9hcGkvYXZhaWxhYmlsaXR5L2RheXMvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwic3RhbmRhbG9uZVwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hdmFpbGFiaWxpdHkvZGF5cy9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F2YWlsYWJpbGl0eS9kYXlzXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hdmFpbGFiaWxpdHkvZGF5cy9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9tYWNib29rL0Rlc2t0b3AvdHJwaS1hcHAvYXBwL2FwaS9hdmFpbGFiaWxpdHkvZGF5cy9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Favailability%2Fdays%2Froute&page=%2Fapi%2Favailability%2Fdays%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Favailability%2Fdays%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Favailability%2Fdays%2Froute&page=%2Fapi%2Favailability%2Fdays%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Favailability%2Fdays%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();