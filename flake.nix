{
  description = "Factorio Map Online";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            postgresql
            xvfb-run
          ];

          shellHook = ''
            # Factorio requires the full client (with rendering) for take_screenshot.
            # headless binary cannot render screenshots.
            # Uses Steam install by default; override with FACTORIO_BINARY env var.
            export FACTORIO_BINARY="''${FACTORIO_BINARY:-$HOME/.local/share/Steam/steamapps/common/Factorio/bin/x64/factorio}"
            export FACTORIO_DATADIR="''${FACTORIO_DATADIR:-$HOME/.factorio}"
            export FACTORIO_SCRIPTOUTPUT="''${FACTORIO_SCRIPTOUTPUT:-$HOME/.factorio/script-output}"
          '';
        };
      }
    );
}
