package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"

	"github.com/Wei-Shaw/sub2api/ent/schema/mixins"
)

// Message holds the schema definition for the Message entity.
type Message struct {
	ent.Schema
}

func (Message) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "messages"},
	}
}

func (Message) Mixin() []ent.Mixin {
	return []ent.Mixin{
		mixins.TimeMixin{},
	}
}

func (Message) Fields() []ent.Field {
	return []ent.Field{
		field.Int64("conversation_id").
			Comment("所属对话"),
		field.Enum("role").
			Values("user", "assistant", "system").
			Comment("消息角色"),
		field.Text("content").
			Default("").
			Comment("文本内容"),
		field.String("content_type").
			MaxLen(20).
			Default("text").
			Comment("内容类型：text / image_generation"),
		field.JSON("image_urls", []string{}).
			Optional().
			Comment("生成的图片 URL 列表"),
		field.String("model").
			MaxLen(100).
			Optional().
			Nillable().
			Comment("生成该消息的模型"),
		field.Int("tokens_used").
			Default(0).
			Comment("token 消耗"),
		field.Float("cost_usd").
			SchemaType(map[string]string{dialect.Postgres: "decimal(20,8)"}).
			Default(0).
			Comment("费用"),
		field.JSON("metadata", map[string]interface{}{}).
			Optional().
			Comment("扩展信息（图片参数等）"),
	}
}

func (Message) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("conversation", Conversation.Type).
			Ref("messages").
			Field("conversation_id").
			Unique().
			Required(),
	}
}

func (Message) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("conversation_id", "created_at"),
	}
}
