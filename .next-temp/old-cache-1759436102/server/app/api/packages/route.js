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
exports.id = "app/api/packages/route";
exports.ids = ["app/api/packages/route"];
exports.modules = {

/***/ "(rsc)/./app/api/packages/route.ts":
/*!***********************************!*\
  !*** ./app/api/packages/route.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n/* harmony import */ var _lib_api_response__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/api-response */ \"(rsc)/./lib/api-response.ts\");\n\n\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(\"https://frzciymslvpohhyefmtr.supabase.co\", process.env.SUPABASE_SERVICE_ROLE_KEY);\n/**\n * GET /api/packages\n * Returns all available packages for purchase\n */ async function GET(request) {\n    try {\n        const { data: packages, error } = await supabase.from('package_definitions').select('*').eq('is_active', true).order('sort_order', {\n            ascending: true\n        });\n        if (error) {\n            console.error('Error fetching packages:', error);\n            throw new Error('Failed to fetch packages');\n        }\n        return (0,_lib_api_response__WEBPACK_IMPORTED_MODULE_0__.successResponse)({\n            packages: packages || []\n        });\n    } catch (error) {\n        return (0,_lib_api_response__WEBPACK_IMPORTED_MODULE_0__.handleApiError)(error);\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3BhY2thZ2VzL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUNvRDtBQUNnQjtBQUVwRSxNQUFNRyxXQUFXSCxtRUFBWUEsQ0FDM0JJLDBDQUFvQyxFQUNwQ0EsUUFBUUMsR0FBRyxDQUFDRSx5QkFBeUI7QUFHdkM7OztDQUdDLEdBQ00sZUFBZUMsSUFBSUMsT0FBb0I7SUFDNUMsSUFBSTtRQUNGLE1BQU0sRUFBRUMsTUFBTUMsUUFBUSxFQUFFQyxLQUFLLEVBQUUsR0FBRyxNQUFNVCxTQUNyQ1UsSUFBSSxDQUFDLHVCQUNMQyxNQUFNLENBQUMsS0FDUEMsRUFBRSxDQUFDLGFBQWEsTUFDaEJDLEtBQUssQ0FBQyxjQUFjO1lBQUVDLFdBQVc7UUFBSztRQUV6QyxJQUFJTCxPQUFPO1lBQ1RNLFFBQVFOLEtBQUssQ0FBQyw0QkFBNEJBO1lBQzFDLE1BQU0sSUFBSU8sTUFBTTtRQUNsQjtRQUVBLE9BQU9qQixrRUFBZUEsQ0FBQztZQUNyQlMsVUFBVUEsWUFBWSxFQUFFO1FBQzFCO0lBRUYsRUFBRSxPQUFPQyxPQUFPO1FBQ2QsT0FBT1gsaUVBQWNBLENBQUNXO0lBQ3hCO0FBQ0YiLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYWNib29rL0Rlc2t0b3AvdHJwaS1hcHAvYXBwL2FwaS9wYWNrYWdlcy9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInXG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXG5pbXBvcnQgeyBoYW5kbGVBcGlFcnJvciwgc3VjY2Vzc1Jlc3BvbnNlIH0gZnJvbSAnQC9saWIvYXBpLXJlc3BvbnNlJ1xuXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcbiAgcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMISxcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSFcbilcblxuLyoqXG4gKiBHRVQgL2FwaS9wYWNrYWdlc1xuICogUmV0dXJucyBhbGwgYXZhaWxhYmxlIHBhY2thZ2VzIGZvciBwdXJjaGFzZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBkYXRhOiBwYWNrYWdlcywgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAuZnJvbSgncGFja2FnZV9kZWZpbml0aW9ucycpXG4gICAgICAuc2VsZWN0KCcqJylcbiAgICAgIC5lcSgnaXNfYWN0aXZlJywgdHJ1ZSlcbiAgICAgIC5vcmRlcignc29ydF9vcmRlcicsIHsgYXNjZW5kaW5nOiB0cnVlIH0pXG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHBhY2thZ2VzOicsIGVycm9yKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZmV0Y2ggcGFja2FnZXMnKVxuICAgIH1cblxuICAgIHJldHVybiBzdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgcGFja2FnZXM6IHBhY2thZ2VzIHx8IFtdXG4gICAgfSlcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBoYW5kbGVBcGlFcnJvcihlcnJvcilcbiAgfVxufVxuIl0sIm5hbWVzIjpbImNyZWF0ZUNsaWVudCIsImhhbmRsZUFwaUVycm9yIiwic3VjY2Vzc1Jlc3BvbnNlIiwic3VwYWJhc2UiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIiwiU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSIsIkdFVCIsInJlcXVlc3QiLCJkYXRhIiwicGFja2FnZXMiLCJlcnJvciIsImZyb20iLCJzZWxlY3QiLCJlcSIsIm9yZGVyIiwiYXNjZW5kaW5nIiwiY29uc29sZSIsIkVycm9yIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/packages/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/api-response.ts":
/*!*****************************!*\
  !*** ./lib/api-response.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ApiError: () => (/* binding */ ApiError),\n/* harmony export */   AuthenticationError: () => (/* binding */ AuthenticationError),\n/* harmony export */   AuthorizationError: () => (/* binding */ AuthorizationError),\n/* harmony export */   ConflictError: () => (/* binding */ ConflictError),\n/* harmony export */   DatabaseError: () => (/* binding */ DatabaseError),\n/* harmony export */   NotFoundError: () => (/* binding */ NotFoundError),\n/* harmony export */   ValidationError: () => (/* binding */ ValidationError),\n/* harmony export */   handleApiError: () => (/* binding */ handleApiError),\n/* harmony export */   paginatedResponse: () => (/* binding */ paginatedResponse),\n/* harmony export */   parsePagination: () => (/* binding */ parsePagination),\n/* harmony export */   successResponse: () => (/* binding */ successResponse),\n/* harmony export */   validateRequired: () => (/* binding */ validateRequired)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\nclass ApiError extends Error {\n    constructor(statusCode, message, details, code){\n        super(message), this.statusCode = statusCode, this.details = details, this.code = code;\n        this.name = 'ApiError';\n    }\n}\nclass ValidationError extends ApiError {\n    constructor(message, details){\n        super(400, message, details, 'VALIDATION_ERROR');\n    }\n}\nclass AuthenticationError extends ApiError {\n    constructor(message = 'Authentication required'){\n        super(401, message, null, 'AUTHENTICATION_ERROR');\n    }\n}\nclass AuthorizationError extends ApiError {\n    constructor(message = 'Insufficient permissions'){\n        super(403, message, null, 'AUTHORIZATION_ERROR');\n    }\n}\nclass NotFoundError extends ApiError {\n    constructor(resource = 'Resource'){\n        super(404, `${resource} not found`, null, 'NOT_FOUND_ERROR');\n    }\n}\nclass ConflictError extends ApiError {\n    constructor(message, details){\n        super(409, message, details, 'CONFLICT_ERROR');\n    }\n}\nclass DatabaseError extends ApiError {\n    constructor(message = 'Database operation failed', details){\n        super(500, message, details, 'DATABASE_ERROR');\n    }\n}\n/**\n * Standardized error response handler for API routes\n */ function handleApiError(error) {\n    console.error('API Error:', error);\n    // Handle our custom API errors\n    if (error instanceof ApiError) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: error.message,\n            code: error.code,\n            details: error.details\n        }, {\n            status: error.statusCode\n        });\n    }\n    // Handle Supabase/PostgreSQL errors\n    if (error && typeof error === 'object' && 'code' in error) {\n        const dbError = error;\n        // Common database error codes\n        switch(dbError.code){\n            case '23505':\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: 'Resource already exists',\n                    code: 'DUPLICATE_ERROR'\n                }, {\n                    status: 409\n                });\n            case '23503':\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: 'Referenced resource does not exist',\n                    code: 'FOREIGN_KEY_ERROR'\n                }, {\n                    status: 400\n                });\n            case '23514':\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: 'Invalid data provided',\n                    code: 'VALIDATION_ERROR'\n                }, {\n                    status: 400\n                });\n            case 'PGRST116':\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: 'Resource not found',\n                    code: 'NOT_FOUND_ERROR'\n                }, {\n                    status: 404\n                });\n            default:\n                console.error('Unhandled database error:', dbError);\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: 'Database error occurred',\n                    code: 'DATABASE_ERROR'\n                }, {\n                    status: 500\n                });\n        }\n    }\n    // Handle generic JavaScript errors\n    if (error instanceof Error) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Internal server error',\n            code: 'INTERNAL_ERROR'\n        }, {\n            status: 500\n        });\n    }\n    // Fallback for unknown errors\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: 'An unexpected error occurred',\n        code: 'UNKNOWN_ERROR'\n    }, {\n        status: 500\n    });\n}\n/**\n * Success response helper\n */ function successResponse(data, status = 200) {\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        success: true,\n        data\n    }, {\n        status\n    });\n}\n/**\n * Validation helper for request data\n */ function validateRequired(data, requiredFields) {\n    const missingFields = requiredFields.filter((field)=>!data[field]);\n    if (missingFields.length > 0) {\n        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`, {\n            missingFields\n        });\n    }\n}\nfunction parsePagination(searchParams) {\n    const page = parseInt(searchParams.get('page') || '1');\n    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100 items per page\n    ;\n    const offset = (page - 1) * limit;\n    return {\n        page,\n        limit,\n        offset\n    };\n}\nfunction paginatedResponse(data, total, page, limit) {\n    const totalPages = Math.ceil(total / limit);\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        success: true,\n        data,\n        pagination: {\n            page,\n            limit,\n            total,\n            totalPages,\n            hasNext: page < totalPages,\n            hasPrev: page > 1\n        }\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNGLFFBQVFMO0lBRXJDLE9BQU9yQyxxREFBWUEsQ0FBQ21CLElBQUksQ0FBQztRQUN2QkssU0FBUztRQUNURDtRQUNBc0IsWUFBWTtZQUNWWDtZQUNBRztZQUNBSztZQUNBQztZQUNBRyxTQUFTWixPQUFPUztZQUNoQkksU0FBU2IsT0FBTztRQUNsQjtJQUNGO0FBQ0YiLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYWNib29rL0Rlc2t0b3AvdHJwaS1hcHAvbGliL2FwaS1yZXNwb25zZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tICduZXh0L3NlcnZlcidcblxuZXhwb3J0IGNsYXNzIEFwaUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgc3RhdHVzQ29kZTogbnVtYmVyLCBcbiAgICBtZXNzYWdlOiBzdHJpbmcsIFxuICAgIHB1YmxpYyBkZXRhaWxzPzogYW55LFxuICAgIHB1YmxpYyBjb2RlPzogc3RyaW5nXG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpXG4gICAgdGhpcy5uYW1lID0gJ0FwaUVycm9yJ1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uRXJyb3IgZXh0ZW5kcyBBcGlFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgZGV0YWlscz86IGFueSkge1xuICAgIHN1cGVyKDQwMCwgbWVzc2FnZSwgZGV0YWlscywgJ1ZBTElEQVRJT05fRVJST1InKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkVycm9yIGV4dGVuZHMgQXBpRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcgPSAnQXV0aGVudGljYXRpb24gcmVxdWlyZWQnKSB7XG4gICAgc3VwZXIoNDAxLCBtZXNzYWdlLCBudWxsLCAnQVVUSEVOVElDQVRJT05fRVJST1InKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBdXRob3JpemF0aW9uRXJyb3IgZXh0ZW5kcyBBcGlFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZyA9ICdJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMnKSB7XG4gICAgc3VwZXIoNDAzLCBtZXNzYWdlLCBudWxsLCAnQVVUSE9SSVpBVElPTl9FUlJPUicpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBBcGlFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJlc291cmNlOiBzdHJpbmcgPSAnUmVzb3VyY2UnKSB7XG4gICAgc3VwZXIoNDA0LCBgJHtyZXNvdXJjZX0gbm90IGZvdW5kYCwgbnVsbCwgJ05PVF9GT1VORF9FUlJPUicpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbmZsaWN0RXJyb3IgZXh0ZW5kcyBBcGlFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgZGV0YWlscz86IGFueSkge1xuICAgIHN1cGVyKDQwOSwgbWVzc2FnZSwgZGV0YWlscywgJ0NPTkZMSUNUX0VSUk9SJylcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGF0YWJhc2VFcnJvciBleHRlbmRzIEFwaUVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nID0gJ0RhdGFiYXNlIG9wZXJhdGlvbiBmYWlsZWQnLCBkZXRhaWxzPzogYW55KSB7XG4gICAgc3VwZXIoNTAwLCBtZXNzYWdlLCBkZXRhaWxzLCAnREFUQUJBU0VfRVJST1InKVxuICB9XG59XG5cbi8qKlxuICogU3RhbmRhcmRpemVkIGVycm9yIHJlc3BvbnNlIGhhbmRsZXIgZm9yIEFQSSByb3V0ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZUFwaUVycm9yKGVycm9yOiB1bmtub3duKTogTmV4dFJlc3BvbnNlIHtcbiAgY29uc29sZS5lcnJvcignQVBJIEVycm9yOicsIGVycm9yKVxuICBcbiAgLy8gSGFuZGxlIG91ciBjdXN0b20gQVBJIGVycm9yc1xuICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBBcGlFcnJvcikge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgIHsgXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLCBcbiAgICAgICAgY29kZTogZXJyb3IuY29kZSxcbiAgICAgICAgZGV0YWlsczogZXJyb3IuZGV0YWlscyBcbiAgICAgIH0sXG4gICAgICB7IHN0YXR1czogZXJyb3Iuc3RhdHVzQ29kZSB9XG4gICAgKVxuICB9XG4gIFxuICAvLyBIYW5kbGUgU3VwYWJhc2UvUG9zdGdyZVNRTCBlcnJvcnNcbiAgaWYgKGVycm9yICYmIHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCcgJiYgJ2NvZGUnIGluIGVycm9yKSB7XG4gICAgY29uc3QgZGJFcnJvciA9IGVycm9yIGFzIGFueVxuICAgIFxuICAgIC8vIENvbW1vbiBkYXRhYmFzZSBlcnJvciBjb2Rlc1xuICAgIHN3aXRjaCAoZGJFcnJvci5jb2RlKSB7XG4gICAgICBjYXNlICcyMzUwNSc6IC8vIHVuaXF1ZV92aW9sYXRpb25cbiAgICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgICAgIHsgZXJyb3I6ICdSZXNvdXJjZSBhbHJlYWR5IGV4aXN0cycsIGNvZGU6ICdEVVBMSUNBVEVfRVJST1InIH0sXG4gICAgICAgICAgeyBzdGF0dXM6IDQwOSB9XG4gICAgICAgIClcbiAgICAgIGNhc2UgJzIzNTAzJzogLy8gZm9yZWlnbl9rZXlfdmlvbGF0aW9uXG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgICAgICB7IGVycm9yOiAnUmVmZXJlbmNlZCByZXNvdXJjZSBkb2VzIG5vdCBleGlzdCcsIGNvZGU6ICdGT1JFSUdOX0tFWV9FUlJPUicgfSxcbiAgICAgICAgICB7IHN0YXR1czogNDAwIH1cbiAgICAgICAgKVxuICAgICAgY2FzZSAnMjM1MTQnOiAvLyBjaGVja192aW9sYXRpb25cbiAgICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgICAgIHsgZXJyb3I6ICdJbnZhbGlkIGRhdGEgcHJvdmlkZWQnLCBjb2RlOiAnVkFMSURBVElPTl9FUlJPUicgfSxcbiAgICAgICAgICB7IHN0YXR1czogNDAwIH1cbiAgICAgICAgKVxuICAgICAgY2FzZSAnUEdSU1QxMTYnOiAvLyBObyByb3dzIHJldHVybmVkXG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgICAgICB7IGVycm9yOiAnUmVzb3VyY2Ugbm90IGZvdW5kJywgY29kZTogJ05PVF9GT1VORF9FUlJPUicgfSxcbiAgICAgICAgICB7IHN0YXR1czogNDA0IH1cbiAgICAgICAgKVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcignVW5oYW5kbGVkIGRhdGFiYXNlIGVycm9yOicsIGRiRXJyb3IpXG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgICAgICB7IGVycm9yOiAnRGF0YWJhc2UgZXJyb3Igb2NjdXJyZWQnLCBjb2RlOiAnREFUQUJBU0VfRVJST1InIH0sXG4gICAgICAgICAgeyBzdGF0dXM6IDUwMCB9XG4gICAgICAgIClcbiAgICB9XG4gIH1cbiAgXG4gIC8vIEhhbmRsZSBnZW5lcmljIEphdmFTY3JpcHQgZXJyb3JzXG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsIGNvZGU6ICdJTlRFUk5BTF9FUlJPUicgfSxcbiAgICAgIHsgc3RhdHVzOiA1MDAgfVxuICAgIClcbiAgfVxuICBcbiAgLy8gRmFsbGJhY2sgZm9yIHVua25vd24gZXJyb3JzXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICB7IGVycm9yOiAnQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZCcsIGNvZGU6ICdVTktOT1dOX0VSUk9SJyB9LFxuICAgIHsgc3RhdHVzOiA1MDAgfVxuICApXG59XG5cbi8qKlxuICogU3VjY2VzcyByZXNwb25zZSBoZWxwZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1Y2Nlc3NSZXNwb25zZTxUPihkYXRhOiBULCBzdGF0dXM6IG51bWJlciA9IDIwMCk6IE5leHRSZXNwb25zZSB7XG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUsIGRhdGEgfSwgeyBzdGF0dXMgfSlcbn1cblxuLyoqXG4gKiBWYWxpZGF0aW9uIGhlbHBlciBmb3IgcmVxdWVzdCBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVJlcXVpcmVkKGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4sIHJlcXVpcmVkRmllbGRzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBtaXNzaW5nRmllbGRzID0gcmVxdWlyZWRGaWVsZHMuZmlsdGVyKGZpZWxkID0+ICFkYXRhW2ZpZWxkXSlcbiAgXG4gIGlmIChtaXNzaW5nRmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKFxuICAgICAgYE1pc3NpbmcgcmVxdWlyZWQgZmllbGRzOiAke21pc3NpbmdGaWVsZHMuam9pbignLCAnKX1gLFxuICAgICAgeyBtaXNzaW5nRmllbGRzIH1cbiAgICApXG4gIH1cbn1cblxuLyoqXG4gKiBQYWdpbmF0aW9uIGhlbHBlclxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2luYXRpb25QYXJhbXMge1xuICBwYWdlPzogbnVtYmVyXG4gIGxpbWl0PzogbnVtYmVyXG4gIG9mZnNldD86IG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQYWdpbmF0aW9uKHNlYXJjaFBhcmFtczogVVJMU2VhcmNoUGFyYW1zKTogUGFnaW5hdGlvblBhcmFtcyB7XG4gIGNvbnN0IHBhZ2UgPSBwYXJzZUludChzZWFyY2hQYXJhbXMuZ2V0KCdwYWdlJykgfHwgJzEnKVxuICBjb25zdCBsaW1pdCA9IE1hdGgubWluKHBhcnNlSW50KHNlYXJjaFBhcmFtcy5nZXQoJ2xpbWl0JykgfHwgJzEwJyksIDEwMCkgLy8gTWF4IDEwMCBpdGVtcyBwZXIgcGFnZVxuICBjb25zdCBvZmZzZXQgPSAocGFnZSAtIDEpICogbGltaXRcbiAgXG4gIHJldHVybiB7IHBhZ2UsIGxpbWl0LCBvZmZzZXQgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2luYXRlZFJlc3BvbnNlPFQ+IHtcbiAgZGF0YTogVFtdXG4gIHBhZ2luYXRpb246IHtcbiAgICBwYWdlOiBudW1iZXJcbiAgICBsaW1pdDogbnVtYmVyXG4gICAgdG90YWw6IG51bWJlclxuICAgIHRvdGFsUGFnZXM6IG51bWJlclxuICAgIGhhc05leHQ6IGJvb2xlYW5cbiAgICBoYXNQcmV2OiBib29sZWFuXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhZ2luYXRlZFJlc3BvbnNlPFQ+KFxuICBkYXRhOiBUW10sIFxuICB0b3RhbDogbnVtYmVyLCBcbiAgcGFnZTogbnVtYmVyLCBcbiAgbGltaXQ6IG51bWJlclxuKTogTmV4dFJlc3BvbnNlIHtcbiAgY29uc3QgdG90YWxQYWdlcyA9IE1hdGguY2VpbCh0b3RhbCAvIGxpbWl0KVxuICBcbiAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIGRhdGEsXG4gICAgcGFnaW5hdGlvbjoge1xuICAgICAgcGFnZSxcbiAgICAgIGxpbWl0LFxuICAgICAgdG90YWwsXG4gICAgICB0b3RhbFBhZ2VzLFxuICAgICAgaGFzTmV4dDogcGFnZSA8IHRvdGFsUGFnZXMsXG4gICAgICBoYXNQcmV2OiBwYWdlID4gMVxuICAgIH1cbiAgfSlcbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJBcGlFcnJvciIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJzdGF0dXNDb2RlIiwibWVzc2FnZSIsImRldGFpbHMiLCJjb2RlIiwibmFtZSIsIlZhbGlkYXRpb25FcnJvciIsIkF1dGhlbnRpY2F0aW9uRXJyb3IiLCJBdXRob3JpemF0aW9uRXJyb3IiLCJOb3RGb3VuZEVycm9yIiwicmVzb3VyY2UiLCJDb25mbGljdEVycm9yIiwiRGF0YWJhc2VFcnJvciIsImhhbmRsZUFwaUVycm9yIiwiZXJyb3IiLCJjb25zb2xlIiwianNvbiIsInN0YXR1cyIsImRiRXJyb3IiLCJzdWNjZXNzUmVzcG9uc2UiLCJkYXRhIiwic3VjY2VzcyIsInZhbGlkYXRlUmVxdWlyZWQiLCJyZXF1aXJlZEZpZWxkcyIsIm1pc3NpbmdGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZCIsImxlbmd0aCIsImpvaW4iLCJwYXJzZVBhZ2luYXRpb24iLCJzZWFyY2hQYXJhbXMiLCJwYWdlIiwicGFyc2VJbnQiLCJnZXQiLCJsaW1pdCIsIk1hdGgiLCJtaW4iLCJvZmZzZXQiLCJwYWdpbmF0ZWRSZXNwb25zZSIsInRvdGFsIiwidG90YWxQYWdlcyIsImNlaWwiLCJwYWdpbmF0aW9uIiwiaGFzTmV4dCIsImhhc1ByZXYiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/api-response.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fpackages%2Froute&page=%2Fapi%2Fpackages%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fpackages%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fpackages%2Froute&page=%2Fapi%2Fpackages%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fpackages%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_macbook_Desktop_trpi_app_app_api_packages_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/packages/route.ts */ \"(rsc)/./app/api/packages/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/packages/route\",\n        pathname: \"/api/packages\",\n        filename: \"route\",\n        bundlePath: \"app/api/packages/route\"\n    },\n    resolvedPagePath: \"/Users/macbook/Desktop/trpi-app/app/api/packages/route.ts\",\n    nextConfigOutput,\n    userland: _Users_macbook_Desktop_trpi_app_app_api_packages_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZwYWNrYWdlcyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGcGFja2FnZXMlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZwYWNrYWdlcyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRm1hY2Jvb2slMkZEZXNrdG9wJTJGdHJwaS1hcHAlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGbWFjYm9vayUyRkRlc2t0b3AlMkZ0cnBpLWFwcCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD1zdGFuZGFsb25lJnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ1M7QUFDdEY7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9tYWNib29rL0Rlc2t0b3AvdHJwaS1hcHAvYXBwL2FwaS9wYWNrYWdlcy9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJzdGFuZGFsb25lXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3BhY2thZ2VzL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvcGFja2FnZXNcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL3BhY2thZ2VzL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL21hY2Jvb2svRGVza3RvcC90cnBpLWFwcC9hcHAvYXBpL3BhY2thZ2VzL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fpackages%2Froute&page=%2Fapi%2Fpackages%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fpackages%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

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
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fpackages%2Froute&page=%2Fapi%2Fpackages%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fpackages%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();