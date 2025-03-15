/*
Standard in Rust is to use the syn and quote crates for writing macros, and not doing string
parsing to write macros as I have done below.

I experimented heavily with syn and quote but ultimately decided that I prefer the code without
them. My complaints:

- quote uses the type proc_macro2, but the actual macro functions must accept proc_macro, forcing
  you to do obnoxious conversions and handle both times in imports, you must alias one of the
  types, etc
- syn's overall design is quite poor - I don't necessarily agree with forcing the user to construct
  a struct of the macro inputs before then constructing the output. Overall the API of a lot of
  the functions exposed just feels sloppy to me. The documentation is quite poor and when trying to
  convert code to syn, I spent a ton of time crawling through docs trying to do things that were
  easy with strings - anyone wanting to alter or read my macro code in the future would have to do
  the same. For example, the 'parenthesized' function - why is this a macro? And that is a terrible
  name for what that actually does. Again, the code sample:
    parse_macro_input!(token_stream as FindFixtureInput);
  Why is this a macro? Why do you force me to use this strange 'as' syntax as the macro input?
- The massive type system and API of syn introduced a huge amount of unnecessary complexity into
  the code. Tons of imports of unfamiliar types, usage of those types everywhere.
- Because neither syn or quote offer any method for formatting code, and quote spits out
  unformatted junk, it's usage actually made debugging harder. With macro code stored as a
  regularly formatted string, I can just 'eprintln' it and easily read through. Not so with what
  quote spits out.

I like restricting my projects to only a handful of extremely high-quality libraries, so I'll stick
to rolling my own macro code for now. My approach is fine.
*/

extern crate proc_macro;
use proc_macro::{TokenStream, TokenTree, Delimiter};

// macro utility functions
fn assert_next(iter: &mut impl Iterator<Item = TokenTree>, next: &str) {
    if &iter.next().unwrap().to_string()[..] != next {
        panic!("Next token must be the '{}' keyword.", next);
    }
}
fn assert_stream(iter: &mut impl Iterator<Item = TokenTree>, start_token: &str) -> impl Iterator<Item = TokenTree> {

    let token_type = if start_token == "(" { "parenthesis" } else { "curly brace" };

    let next_token = iter.next().unwrap();
    let bracket_iter = if let TokenTree::Group(group) = next_token {
        if
            (start_token == "(" && group.delimiter() == Delimiter::Parenthesis) ||
            (start_token == "{" && group.delimiter() == Delimiter::Brace)
        {
            group.stream().into_iter()
        } else { panic!("Next token must be an opening {}, found {:?}.", token_type, group.delimiter()) }
    } else { panic!("Next token must be an opening {}, found {:?}.", token_type, next_token) };

    return bracket_iter;
}
fn remove_commas(iter: impl Iterator<Item = TokenTree>) -> Vec<String> {
    iter.map(|token| token.to_string())
        .collect::<Vec<String>>()
        .join("")
        .split(",")
        .map(|slice| slice.to_owned())
        .collect()
}


/*
Macro that searches for a fixture on a MetaBody with the given data type, and returns an
Option<b2::handle> containing that fixture's handle.

Convert: (player_body is a MetaBody)

    let head = find_fixture_handle!(player_body, FixtureDataTypes::PlayerData)?;

into: ('head' is an Option<TypedHandle<Fixture>>)

    let head = player_body.fixtures().find(|(handle_fixture, _)| {
        let meta_fixture = player_body.fixture(*handle_fixture);
        let data = &meta_fixture.user_data().data;

        match data {
            FixtureDataTypes::PlayerData(_) => return true,
            _ => return false
        };
    }).map(|(handle, _)| handle)?;
*/
#[proc_macro]
pub fn find_fixture_handle(token_stream: TokenStream) -> TokenStream {
    let mut iter = token_stream.into_iter();
    let meta_body: String = iter.next().unwrap().to_string();
    let fixture_data_enum_variant: String = iter
        .map(|token| (token).to_string())
        .collect::<Vec<_>>()[1..5]
        .join("");

    format!(
        "{meta_body}.fixtures().find(|(handle_fixture, _)| {{
            let meta_fixture = {meta_body}.fixture(*handle_fixture);
            let data = &meta_fixture.user_data().data;

            match data {{
                {enum_variant}(_) => return true,
                _ => return false
            }};
        }}).map(|(handle, _)| handle)",
        meta_body = meta_body,
        enum_variant = fixture_data_enum_variant
    ).parse().unwrap()
}

/*
Macro which accepts a MetaBody and a list of the data types of it's associated fixtures, and
returns each of it's fixtures and their associated data, unpacked.

Access to the fixtures and their data requires a mutable borrow on the body, so if you want to
perform operations on the body inside the macro block you must first drop each of the fixtures and
their data.

TODO: performance of this macro can be improved by deleting the find_fixture_handle calls and
writing the loop manually; that way we can unpack the enums into their variants only once
instead of twice, and avoid some extra pointer chasing with the extra handle conversion.

Convert: (where player_body is a MetaBody of a player)

    unpack!{
        let (head, head_data, jump_sensor, jump_sensor_data) = unpack(
            player_body,
            FixtureDataTypes::PlayerData,
            FixtureDataTypes::JumpSensorData
        );
        [...remaining code here...]
    }

turns into:

    {
        if let Some(__head_handle) = find_fixture_handle!(player_body, FixtureDataTypes::PlayerData) {
            if let Some(__jump_sensor_handle) = find_fixture_handle!(player_body, FixtureDataTypes::JumpSensorData) {

                let head = player_body.fixture_mut(__head_handle);
                let jump_sensor = player_body.fixture_mut(__jump_sensor_handle);

                if let &mut FixtureDataTypes::PlayerData(head_data) = head.user_data_mut().data {
                    if let &mut FixtureDataTypes::JumpSensorData(jump_sensor_data) = jump_sensor.user_data_mut().data {
                        [...remaining code here...]
                    }
                }
            }
        }
    }
*/
struct UnpackInputs {
    input_body_var: String,
    target_enum_variants: Vec<String>,
    output_fixture_var_names: Vec<String>,
    output_fixture_data_names: Vec<String>,
    output_fixture_handle_names: Vec<String>,
    remaining_tokens: TokenStream
}

impl UnpackInputs {
    fn from_input_stream(token_stream: TokenStream) -> UnpackInputs {
        let mut iter = token_stream.into_iter();

        assert_next(&mut iter, "let");
        let goal_values_iter = assert_stream(&mut iter, "(");

        // Parse the '(head, head_data, jump_sensor, jump_sensor_data)' into an array
        let declared_vars: Vec<String> = remove_commas(goal_values_iter);

        assert_next(&mut iter, "=");
        assert_next(&mut iter, "unpack");
        let mut param_values_iter = assert_stream(&mut iter, "(");

        // Parse the '(player_body, FixtureDataTypes::PlayerData, FixtureDataTypes::JumpSensorData);'
        let input_body_var = param_values_iter.next().unwrap().to_string();
        assert_next(&mut param_values_iter, ",");
        let target_enum_variants = remove_commas(param_values_iter);

        // Assert that we have defined the same number of objects as we will be unpacking
        if declared_vars.len() != target_enum_variants.len() * 2 {
            panic!(
                concat!(
                    "Number of vars to unpack must be 2x the number of data types input.",
                    "Found vars to unpack:\n",
                    "{:?}\n",
                    "Found input data types:\n",
                    "{:?}"
                ),
                declared_vars,
                target_enum_variants
            );
        }
        assert_next(&mut iter, ";");

        let remaining_tokens = iter.collect::<TokenStream>();

        let num_variants = target_enum_variants.len();

        let mut output_fixture_handle_names = Vec::with_capacity(num_variants);
        let mut output_fixture_var_names = Vec::with_capacity(num_variants);
        let mut output_fixture_data_names = Vec::with_capacity(num_variants);

        for i in 0..num_variants {
            let output_fixture_var_name = declared_vars[i*2].clone();

            output_fixture_handle_names.push(format!("{}{}{}", "__", output_fixture_var_name, "_handle"));
            output_fixture_var_names.push(output_fixture_var_name);
            output_fixture_data_names.push(declared_vars[(i * 2) + 1].clone());
        }

        UnpackInputs {
            input_body_var,
            target_enum_variants,
            output_fixture_var_names,
            output_fixture_data_names,
            output_fixture_handle_names,
            remaining_tokens
        }
    }
    fn to_macro_output(self) -> String {
        let num_variants = self.target_enum_variants.len();

        let mut final_token_stream = self.remaining_tokens.to_string();

        for i in 0..num_variants {
            final_token_stream = format!("
                if let {}({}) = &mut {}.user_data_mut().data {{
                    {}
                }}",
                self.target_enum_variants[i],
                self.output_fixture_data_names[i],
                self.output_fixture_var_names[i],
                final_token_stream
            );
        }
        for i in 0..num_variants {
            final_token_stream = format!(
                "let mut {} = {}.fixture_mut({});",
                self.output_fixture_var_names[i],
                self.input_body_var,
                self.output_fixture_handle_names[i]
            ) + &final_token_stream;
        }
        for i in 0..num_variants {
            final_token_stream = format!(
                "if let Some({}) = find_fixture_handle!({}, {}) {{
                    {}
                }}",
                self.output_fixture_handle_names[i],
                self.input_body_var,
                self.target_enum_variants[i],
                final_token_stream
            );
        }
        format!(
            "{{
                {}
            }}",
            final_token_stream
        )
    }
}

#[proc_macro]
pub fn unpack(token_stream: TokenStream) -> TokenStream {
    let inputs = UnpackInputs::from_input_stream(token_stream);
    inputs.to_macro_output().parse().unwrap()
}
