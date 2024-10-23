# Solution

You can also find the solution to the challenge in the `solution` branch of this repository.

Below, you can see the code snippet that should should be added in `express/app.ts` to implement the DELETE endpoint for deleting a conversation and its messages.

After adding the code snippet, you can commit the changes and push them to the remote repository.
Genezio will handle the deployment once the changes are pushed to the remote repository.

```typescript
// DELETE /conversations/:conversationId - Delete a conversation and its messages
app.delete('/conversations/:conversationId', async (req: Request, res:Response) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    res.json({ message: "Missing conversationId" });
  }

  try {
    if (process.env["CHAT_APP_DATABASE_URL"]) {
      await connectToDatabase();
      await Conversation.deleteOne({ conversationId });
      await Message.deleteMany({ conversationId });
    } else {
      console.warn("Could not connect to the database, using mock data.");
    }

    res.json({ message: "Conversation deleted successfully" });
    return;
  } catch (error) {
    console.warn("Could not connect to the database, using mock data.", error);
    res.json({ message: "Could not delete conversation" });
    return;
  }
});
```
