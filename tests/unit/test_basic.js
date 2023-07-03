import { Logger }			from '@whi/weblogger';
const log				= new Logger("unit-test", (import.meta.url === import.meta.main) && process.env.LOG_LEVEL );

import { expect }			from 'chai';
import {
    OptionType, None,
    VecType, MapType,
    intoStruct,
}					from '../../src/index.js';

const PostStruct = {
    "message":			String,
    "tags":			VecType( String ),
    "ratings":			MapType( String, Number ),

    "published_at":		Number,
    "last_updated":		Number,
    "metadata":			Object,
};

function basic_tests () {
    it("should successfully create post", async () => {
	const post			= intoStruct( {
	    "message":		"Hello, world!",
	    "tags":		[ "greeting" ],
	    "ratings": {
		"helpful":	102,
	    },

	    "published_at":	Date.now(),
	    "last_updated":	Date.now(),
	    "metadata":		{},
	}, PostStruct );

	expect( post.message		).to.be.a("string");
	expect( post.tags		).to.be.a("array");
	expect( post.ratings		).to.be.a("object");
	expect( post.published_at	).to.be.a("number");
	expect( post.last_updated	).to.be.a("number");
	expect( post.metadata		).to.be.a("object");
    });
}

describe("intoStruct", () => {

    describe("Basic", basic_tests );
});
