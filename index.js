const { browser: browserGlobals, node: nodeGlobals } = require("globals");

const browserGlobalNames = Object.keys(browserGlobals);
const nodeGlobalNames = Object.keys(nodeGlobals);

const browserOnlyGlobals = browserGlobalNames.filter(
  (name) => !nodeGlobalNames.includes(name),
);

module.exports = {
  rules: {
    "no-ssr-browser-globals": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow browser-specific globals (e.g., `window`, `document`) in SSR contexts.",
          category: "Possible Errors",
          recommended: true,
        },
        schema: [
          {
            type: "object",
            properties: {
              allowedGlobals: {
                type: "array",
                items: { type: "string" },
                default: [],
              },
              allowedHooks: {
                type: "array",
                items: { type: "string" },
                default: ["useEffect", "useLayoutEffect"],
              },
              allowedFunctions: {
                type: "array",
                items: { type: "string" },
                default: ["setTimeout", "setInterval"],
              },
              conditionCheck: { type: "boolean", default: true },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const options = context.options[0] || {};
        const allowedGlobals = nodeGlobalNames.concat(
          options.allowedGlobals || [],
        );
        const allowedHooks = options.allowedHooks || [
          "useEffect",
          "useLayoutEffect",
        ];
        const allowedFunctions = options.allowedFunctions || [
          "setTimeout",
          "setInterval",
          "requestAnimationFrame",
        ];
        const conditionCheck = options.conditionCheck !== false;

        // Ensure this rule runs only on JSX/TSX files
        if (!/\.(jsx|tsx)$/i.test(context.getFilename())) {
          return {};
        }

        /**
         * Determines whether the given node is inside a safe client-side context.
         * @param {ASTNode} node - The current AST node.
         * @returns {boolean} True if the node is in a safe context, false otherwise.
         */
        function isSafeContext(node) {
          const sourceCode = context.sourceCode ?? context.getSourceCode();
          let current = node;

          const parent = node.parent;

          /**
           * ```
           * const obj = { location: 'localhost' }; // allowed
           * ```
           * */
          if (
            parent.type === "Property" &&
            parent.key === node &&
            !parent.computed // Static key
          ) {
            return true;
          }

          /**
           * Check for member expressions like `obj.location`
           * ```
           *  const host = location.host; // not allowed
           *
           *  const obj = { location: 'localhost' };
           *  const host = obj.location; // allowed
           * ```
           * */
          if (
            node.parent.type === "MemberExpression" &&
            node.parent.property === node
          ) {
            return true;
          }

          while (current) {
            // TS types are allowed
            if (
              current.type === "TSTypeLiteral" ||
              current.type === "TSTypeAnnotation" ||
              current.type === "TSTypeReference" ||
              current.type === "TSTypeAliasDeclaration"
            ) {
              return true;
            }

            // Check React hooks like useEffect and useLayoutEffect
            if (
              current.type === "CallExpression" &&
              current.callee.type === "Identifier" &&
              allowedHooks.includes(current.callee.name)
            ) {
              return true;
            }

            // Check browser-specific async functions like setTimeout
            if (
              current.type === "CallExpression" &&
              current.callee.type === "Identifier" &&
              allowedFunctions.includes(current.callee.name)
            ) {
              return true;
            }

            // Check event handlers like onClick or onChange
            if (
              current.type === "JSXAttribute" &&
              current.name.type === "JSXIdentifier"
            ) {
              const attributeName = current.name.name;

              /**
               * onClick √
               * onclick ✗
               */
              if (
                attributeName.startsWith("on") &&
                attributeName[2] === attributeName[2].toUpperCase()
              ) {
                return true;
              }
            }

            if (current.type === "ImportExpression") {
              // Check dynamic imports
              return true;
            }

            // Check for window !== 'undefined' condition
            if (
              conditionCheck &&
              current.type === "IfStatement" &&
              current.test.type === "BinaryExpression" &&
              current.test.operator === "!=="
            ) {
              const left = current.test.left;
              const right = current.test.right;

              if (left.name === "window" && right.name === "undefined") {
                return true;
              }
            }

            const comments = sourceCode.getCommentsBefore(current);
            const directComments = comments.filter((comment) => {
              return node.loc.start.line - comment.loc.end.line === 1;
            });

            // Check for client-side annotations
            if (
              directComments.some(
                (comment) => comment.value.trim() === "@client",
              )
            ) {
              return true;
            }

            current = current.parent;
          }

          return false;
        }

        /**
         * Checks for disallowed usage of browser-specific globals.
         * @param {ASTNode} node - The current AST node.
         */
        return {
          Identifier(node) {
            const sourceCode = context.sourceCode ?? context.getSourceCode();
            const variablesInScope = sourceCode.getScope(node).variables;

            /**
             * Check if the identifier is a browser-specific global and it is not declared in the current scope.
             *
             * For example:
             *   Location is a browser-only global, so it will be flagged as an error if used in a server-side context.
             *   But if it is declared in the current scope, it will be allowed.
             * ```
             * // Allowed
             * const location = 'localhost';
             *
             * // Not allowed
             * const value = location.host;
             * ```
             */
            if (
              !(
                browserOnlyGlobals.includes(node.name) &&
                !variablesInScope.some(
                  (variable) => variable.name === node.name,
                ) &&
                !allowedGlobals.includes(node.name)
              )
            ) {
              return;
            }

            // Report an error if the node is not in a safe client-side context
            if (!isSafeContext(node)) {
              context.report({
                node,
                message: `'${node.name}' is not allowed in a server-side context. Wrap it in a client-side safe context, such as useEffect or an event handler, or mark it with @client annotation.
---------------------------
// @client
const value = location.host;
-----------
`,
              });
            }
          },
        };
      },
    },
  },
  configs: {
    recommended: {
      rules: {
        "no-ssr-browser-globals": "error",
      },
    },
  },
};
