package schema

import (
	"github.com/Wei-Shaw/sub2api/ent/schema/mixins"

	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Conversation holds the schema definition for the Conversation entity.
type Conversation struct {
	ent.Schema
}

func (Conversation) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "conversations"},
	}
}

func (Conversation) Mixin() []ent.Mixin {
	return []ent.Mixin{
		mixins.TimeMixin{},
		mixins.SoftDeleteMixin{},
	}
}

func (Conversation) Fields() []ent.Field {
	return []ent.Field{
		field.Int64("user_id").
			Comment("所属用户"),
		field.Int64("api_key_id").
			Comment("使用的 API Key"),
		field.String("title").
			MaxLen(200).
			Default("New Chat").
			Comment("对话标题"),
		field.String("model").
			MaxLen(100).
			Default("").
			Comment("最近使用的模型（用于默认选中）"),
		field.Time("last_message_at").
			Optional().
			Nillable().
			SchemaType(map[string]string{dialect.Postgres: "timestamptz"}).
			Comment("最后消息时间，用于排序"),
	}
}

func (Conversation) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("conversations").
			Field("user_id").
			Unique().
			Required(),
		edge.From("api_key", APIKey.Type).
			Ref("conversations").
			Field("api_key_id").
			Unique().
			Required(),
		edge.To("messages", Message.Type),
	}
}

func (Conversation) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("user_id", "deleted_at", "last_message_at"),
		index.Fields("api_key_id"),
	}
}
