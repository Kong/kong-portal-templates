-- Get Initial Files JSON -> Lua table
--   Quick and dirty script to load portal theme from /files api JSON response
--   to lua table for migration.

local cjson = require "cjson"
local file_name = arg[1] or "01_initial_files"
local json_file_name = file_name .. ".json"
local lua_file_name = file_name .. ".lua"

local file = io.open("./" .. json_file_name, "r")
if file then
  print("Converting json files to lua")

  local initial_files_json = cjson.decode(file:read("*all"))

  for k, v in ipairs(initial_files_json["data"]) do
    initial_files_json["data"][k]["created_at"] = nil
    initial_files_json["data"][k]["id"] = nil
  end

  local file = io.open("./" .. lua_file_name, "w+")
  file:write("return " .. require("pl.pretty").write(initial_files_json["data"]))
  file:close()
  print("Complete")
else
  print("Unable to open " ..  file_name)
end
