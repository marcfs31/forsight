// Package cmd wires botobs's CLI (cobra): "botobs run" starts the agent,
// "botobs version" prints the build version.
package cmd

import (
	"context"

	"github.com/spf13/cobra"
)

func newRootCmd() *cobra.Command {
	root := &cobra.Command{
		Use:           "botobs",
		Short:         "botobs is a self-contained observability agent",
		SilenceUsage:  true,
		SilenceErrors: true,
	}
	root.AddCommand(newRunCmd(), newVersionCmd())
	return root
}

// Execute runs the CLI to completion.
func Execute(ctx context.Context) error {
	return newRootCmd().ExecuteContext(ctx)
}
