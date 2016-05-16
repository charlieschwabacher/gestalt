/* description: Parses GraphQL IDL w/ extensions */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
schema                return 'SCHEMA'
scalar                return 'SCALAR'
type                  return 'TYPE'
interface             return 'INTERFACE'
union                 return 'UNION'
enum                  return 'ENUM'
input                 return 'INPUT'
implements            return 'IMPLEMENTS'
"{"                   return 'OPEN'
"}"                   return 'CLOSE'
"("                   return 'OPENP'
")"                   return 'CLOSEP'
","                   return 'COMMA'
"!"                   return 'BANG'
":"                   return 'COLON'
"="                   return 'EQUALS'
"|"                   return 'PIPE'
[a-zA-Z][a-zA-Z0-9]+  return 'IDENTIFIER'
<<EOF>>               return 'EOF'

/lex

%start start

%% /* language grammar */

optionalComma: | COMMA;
optionalBang: | BANG;

start: definitions EOF;
definitions: definitions definition | definition;
definition: schemaDefinition | scalarTypeDefinition | objectTypeDefinition |
  interfaceTypeDefinition | unionTypeDefinition | enumTypeDefinition |
  inputObjectTypeDefinition;

schemaDefinition: SCHEMA OPEN operationDefinitions CLOSE;
operationDefinitions: operationDefinition | operationDefinitions operationDefinition;
operationDefinition: IDENTIFIER COLON IDENTIFIER optionalComma;

scalarTypeDefinition: SCALAR IDENTIFIER;

objectTypeDefinition: TYPE IDENTIFIER optionalInterfaceImplementations OPEN fieldDefinitions CLOSE;
optionalInterfaceImplementations: | IMPLEMENTS interfaceImplementations;
interfaceImplementations: interfaceImplementation | interfaceImplementations interfaceImplementation;
interfaceImplementation: IDENTIFIER optionalComma;
fieldDefinitions: fieldDefinition | fieldDefinitions fieldDefinition;
fieldDefinition: IDENTIFIER optionalArgumentsDefinition COLON IDENTIFIER optionalBang optionalComma;
optionalArgumentsDefinition: | OPENP argumentsDefinition CLOSEP;
argumentsDefinition: argumentDefinition | argumentsDefinition argumentDefinition;
argumentDefinition: IDENTIFIER COLON IDENTIFIER optionalBang optionalComma;

interfaceTypeDefinition: INTERFACE IDENTIFIER OPEN fieldDefinitions CLOSE;

unionTypeDefinition: UNION IDENTIFIER EQUALS unionMembers;
unionMembers: IDENTIFIER | unionMembers PIPE IDENTIFIER;

enumTypeDefinition: ENUM IDENTIFIER OPEN enumValues CLOSE;
enumValues: enumValue | enumValues enumValue;
enumValue: IDENTIFIER optionalComma;

inputObjectTypeDefinition: INPUT IDENTIFIER OPEN inputValueDefinitions CLOSE;
inputValueDefinitions: inputValueDefinition | inputValueDefinitions inputValueDefinition;
inputValueDefinition: IDENTIFIER COLON IDENTIFIER optionalBang optionalComma;
