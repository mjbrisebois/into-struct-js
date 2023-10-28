import repr				from '@whi/repr';


export const AnyType			= Symbol.for("__INTO_STRUCT__.AnyType");

export class OptionStruct {
    constructor ( type ) {
	this.inner_type			= type;
    }

    innerType () {
	return this.inner_type;
    }

    isMatch ( target ) {
	return target === null || true; // TODO: true should be a inner type check
    }
}

export function OptionType ( type ) {
    return new OptionStruct( type );
}

export class VecStruct {
    constructor ( type ) {
	this.inner_type			= type;
    }

    innerType () {
	return this.inner_type;
    }

    isMatch ( target ) {
	return Array.isArray( target );
    }
}

export function VecType ( type ) {
    return new VecStruct( type );
}

export class MapStruct {
    constructor ( key_type, value_type ) {
	this.key_type			= key_type;
	this.value_type			= value_type;
    }

    keyType () {
	return this.key_type;
    }

    valueType () {
	return this.value_type;
    }

    isMatch ( target ) {
	if ( target === null || typeof target !== "object" )
	    return false;

	return target instanceof Map || target instanceof Object || target.constructor?.name === "Object";
    }
}

export function MapType ( key_type, value_type ) {
    return new MapStruct( key_type, value_type );
}

export class None {
    constructor () {
    }

    isMatch ( target ) {
	return target === null;
    }
}

export class EnumStruct {
    constructor ( types ) {
	this.allowed_types		= types.map( t => t === null ? new None() : t );

	// TODO: add check here for non-primitive types and throw error if they didn't supply a
	// function for matching types.

	if ( this.allowed_types.find( t => t instanceof OptionStruct ) )
	    throw new TypeError(`It doesn't make sense to have an Option type in an Enum; just allow a null type`);
    }

    typeNames () {
	return this.allowed_types.map( t => t.name || t.constructor?.name );
    }

    matchType ( target ) {
	const primitive_types		= [ String, Number, Boolean ];

	for ( let type of primitive_types ) {
	    if ( type.name.toLowerCase() === typeof target )
		return type;
	}

	for ( let type of this.allowed_types ) {
	    if ( type.isMatch && type.isMatch( target ) )
		return type;
	}

	return null;
    }

    isMatch ( target ) {
	return this.matchType( target ) !== null;
    }
}

export function EnumType ( types ) {
    return new EnumStruct( types );
}

function typeError ( key, value, expected_type ) {
    throw new TypeError(`Struct expected '${key}' to be a <${expected_type.name}>; not type '${typeof value}'`);
}


export function intoStruct ( target, struct, key = null ) {
    // There are 3 phases here
    //
    //   1. Are we handling a primitive struct
    //   2. Are we handling the 'Object' entry point
    //   3. Are we handling special types (eg. Option, Vec, Map)
    //   4. Are we handling a leaf
    //

    if ( struct === AnyType )
	return target

    // Handle struct === null
    if ( struct === null ) {
	if ( struct === target )
	    return target;

	throw new TypeError(`Struct expects target to be null; not '${typeof target}'`);
    }

    if ( Array.isArray( struct ) ) {
	if ( !Array.isArray( target ) )
	    throw new TypeError(`Struct expects target to be an Array; not type '${repr(target, true)}'`);

	const result			= [];

	for ( let i in struct ) {
	    let type			= struct[ i ];
	    let value			= target[ i ];
	    result.push( intoStruct( value, type, key ? `${key}[ ${i} ]` : `[ ${i} ]` ) );
	}

	return result;
    }

    if ( struct?.constructor?.name === "Object" ) {
	// If the struct is a natural 'Object', then the target should be too.  Otherwise, the for
	// loop will fail.
	if ( target?.constructor?.name !== "Object" )
	    throw new TypeError(`Struct expects target to be a natural 'Object'; not type '${repr(target, true)}'`);

	const result			= {};

	for ( let [k, type] of Object.entries(struct) ) {
	    let value			= target[ k ];
	    result[ k ]			= intoStruct( value, type, key ? `${key}[ ${k} ]` : k );
	}

	return result;
    }

    // Is this an instance of something rather than a class?
    if ( !struct.prototype && struct.constructor ) {
	const type			= struct;

	// console.log("Struct (%s).prototype = %s:", typeof struct, typeof struct.prototype, struct );
	if ( typeof struct !== "object" ) {
	    if ( struct === target )
		return target;

	    throw new TypeError(`Struct expects target to be the specific primitive value '${struct}'; not '${target}'`);
	}

	// handle None
	if ( type instanceof None ) {
	    if ( target !== null )
		typeError( key, target, type.constructor );

	    return null;
	}

	// handle Option<type>
	if ( type instanceof OptionStruct ) {
	    if ( target === null || target === undefined)
		return null;

	    return intoStruct( target, type.innerType(), `${key}?` );
	}

	// handle Vec<type>
	if ( type instanceof VecStruct ) {
	    if ( !Array.isArray( target ) )
		typeError( key, target, type.constructor );

	    const inner_type		= type.innerType();
	    const result		= [];

	    for ( let i in target ) {
		result.push( intoStruct( target[i], inner_type, `${key}[${i}]` ) );
	    }

	    return result;
	}

	// handle Map<key, type>
	if ( type instanceof MapStruct ) {
	    const key_type		= type.keyType();
	    const value_type		= type.valueType();

	    if ( key_type.name === "String" ) {
		if ( !(target.constructor.name === Object.name) )
		    typeError( key, target, type.constructor );

		const obj		= {};

		for ( let vk in target ) {
		    obj[vk]		= intoStruct( target[vk], value_type, `${key}[ ${vk} ]` );
		}

		return obj;
	    }

	    if ( !(target.constructor.name === Map.name) )
		typeError( key, target, Map );

	    const map			= new Map();

	    for ( let [k,v] of target ) {
		const ak		= intoStruct( k, key_type, `${key}[ ${String(k)} ]` );
		const av		= intoStruct( v, value_type, `${key}[ ${String(k)} ]` );
		map.set( ak, av );
	    }

	    return map;
	}

	// handle Enum::<type>
	if ( type instanceof EnumStruct ) {
	    const inner_type		= type.matchType( target );

	    if ( inner_type === null )
		throw new TypeError(`Struct expected '${key}' to be one of <${type.typeNames().join(">, <")}>; not type '${String(target)}'`);

	    return intoStruct( target, inner_type, key );
	}

	throw new TypeError(`Unhandled special type '${type.constructor.name}'`);
    }

    // No value is allowed to be null or undefined here because that would have already been handled
    // by 'OptionType' or 'None'
    if ( target === null ||  target === undefined )
	throw new TypeError(`Struct expected '${key}' to be a <${struct.name}>; not type '${String(target)}'`);

    // After special types
    if ( !struct.prototype )
	throw new TypeError(`Struct definition contains non-callable value at key '${key}': ${repr(struct)}`);

    // target is a primitive value
    if ( typeof target !== "object" ) {
	if ( typeof target !== struct.name.toLowerCase() )
	    typeError( key, target, struct );

	return target;
    }
    // handle primitive structs in object form
    else if ( [ String, Number, Boolean ].includes( struct ) ) {
	if ( !(target instanceof struct ) )
	    typeError( key, target, struct );

	return target.valueOf();
    }
    // handle target already being the expected struct
    else if ( target instanceof struct && target.constructor.name === struct.name ) {
	return target;
    }
    // make target into expected struct
    else {
	try {
	    return new struct( target );
	} catch (err) {
	    throw new TypeError(`Struct expects '${key}' to be a <${struct.name}> but constructor failed with: ${String(err)}`);
	}
    }

    throw new Error(`Unreachable`);
}
